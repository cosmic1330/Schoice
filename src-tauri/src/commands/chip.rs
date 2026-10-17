use chrono::{Duration as ChronoDuration, Local};
use dashmap::DashMap;
use serde::{Deserialize, Serialize};
use std::sync::OnceLock;
use std::time::{Duration, Instant};

const FINMIND_DATA_URL: &str = "https://api.finmindtrade.com/api/v4/data";
static CACHE: OnceLock<DashMap<String, (ChipData, Instant)>> = OnceLock::new();

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InstitutionalSummary {
    pub foreign_5d: i64,
    pub trust_5d: i64,
    pub dealer_5d: i64,
    pub total_5d: i64,
    pub total_20d: i64,
    pub consecutive_days: i32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MarginSummary {
    pub margin_balance: i64,
    pub margin_change_5d: i64,
    pub margin_change_percent_5d: f64,
    pub short_balance: i64,
    pub short_change_5d: i64,
    pub short_margin_ratio: f64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChipDaily {
    pub date: String,
    pub close: f64,
    pub foreign: i64,
    pub trust: i64,
    pub dealer: i64,
    pub institutional_total: i64,
    pub margin_balance: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScoreBreakdown {
    pub factor: String,
    pub points: i32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChipLights {
    pub institutional: String,
    pub foreign_holding: String,
    pub lending_pressure: String,
    pub summary: String,
    pub foreign_ratio: Option<f64>,
    pub foreign_change_5d: Option<f64>,
    pub lending_volume_5d: i64,
    pub lending_change_percent: Option<f64>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChipData {
    pub symbol: String,
    pub as_of: String,
    pub score: i32,
    pub verdict: String,
    pub confidence: String,
    pub institutional: InstitutionalSummary,
    pub margin: MarginSummary,
    pub history: Vec<ChipDaily>,
    pub signals: Vec<String>,
    pub score_breakdown: Vec<ScoreBreakdown>,
    pub lights: ChipLights,
    pub source: String,
}

#[derive(Debug, Deserialize)]
struct FinMindResponse<T> {
    data: Vec<T>,
    #[serde(default)]
    msg: String,
    #[serde(default)]
    status: u16,
}

#[derive(Debug, Deserialize)]
struct InstitutionalRow {
    date: String,
    name: String,
    buy: i64,
    sell: i64,
}

#[derive(Debug, Deserialize)]
#[allow(non_snake_case)]
struct MarginRow {
    date: String,
    MarginPurchaseTodayBalance: i64,
    ShortSaleTodayBalance: i64,
}

#[derive(Debug, Deserialize)]
struct PriceRow {
    date: String,
    close: f64,
}

#[derive(Debug, Deserialize)]
#[allow(non_snake_case)]
struct ShareholdingRow {
    date: String,
    ForeignInvestmentSharesRatio: f64,
}

#[derive(Debug, Deserialize)]
struct SecuritiesLendingRow {
    date: String,
    volume: i64,
}

async fn fetch_dataset<T: for<'de> Deserialize<'de>>(
    client: &reqwest::Client,
    dataset: &str,
    symbol: &str,
    start_date: &str,
) -> Result<Vec<T>, String> {
    let request = client.get(FINMIND_DATA_URL).query(&[
        ("dataset", dataset),
        ("data_id", symbol),
        ("start_date", start_date),
    ]);
    let response = request.send().await.map_err(|error| error.to_string())?;
    if !response.status().is_success() {
        return Err(format!("FinMind HTTP {}", response.status()));
    }
    let payload = response
        .json::<FinMindResponse<T>>()
        .await
        .map_err(|error| error.to_string())?;
    if payload.status >= 400 {
        return Err(if payload.msg.is_empty() {
            "FinMind request failed".to_string()
        } else {
            payload.msg
        });
    }
    Ok(payload.data)
}

fn summarize_institutional(
    rows: &[InstitutionalRow],
) -> Result<(InstitutionalSummary, String), String> {
    let latest = rows
        .iter()
        .map(|row| row.date.as_str())
        .max()
        .ok_or_else(|| "No institutional data".to_string())?
        .to_string();
    let mut dates: Vec<&str> = rows.iter().map(|row| row.date.as_str()).collect();
    dates.sort_unstable();
    dates.dedup();
    let last_20: Vec<&str> = dates.into_iter().rev().take(20).collect();
    let last_5: Vec<&str> = last_20.iter().take(5).copied().collect();
    let mut foreign_5d = 0;
    let mut trust_5d = 0;
    let mut dealer_5d = 0;
    let mut total_5d = 0;
    let mut total_20d = 0;
    let mut daily_totals = Vec::new();

    for date in &last_20 {
        let mut daily = 0;
        for row in rows.iter().filter(|row| row.date == *date) {
            let net = row.buy - row.sell;
            daily += net;
            if last_5.contains(date) {
                match row.name.as_str() {
                    "Foreign_Investor" | "Foreign_Dealer_Self" => foreign_5d += net,
                    "Investment_Trust" => trust_5d += net,
                    name if name.starts_with("Dealer") => dealer_5d += net,
                    _ => {}
                }
            }
        }
        if last_5.contains(date) {
            total_5d += daily;
            daily_totals.push(daily);
        }
        total_20d += daily;
    }
    let first_sign = daily_totals
        .first()
        .map(|value| value.signum())
        .unwrap_or(0);
    let consecutive_days = daily_totals
        .iter()
        .take_while(|value| value.signum() == first_sign && first_sign != 0)
        .count() as i32
        * first_sign as i32;

    Ok((
        InstitutionalSummary {
            foreign_5d,
            trust_5d,
            dealer_5d,
            total_5d,
            total_20d,
            consecutive_days,
        },
        latest,
    ))
}

fn summarize_margin(rows: &[MarginRow]) -> Result<(MarginSummary, String), String> {
    let mut sorted: Vec<&MarginRow> = rows.iter().collect();
    sorted.sort_by(|a, b| b.date.cmp(&a.date));
    let latest = sorted.first().ok_or_else(|| "No margin data".to_string())?;
    let base = sorted.get(5).or_else(|| sorted.last()).unwrap_or(latest);
    let margin_change_5d = latest.MarginPurchaseTodayBalance - base.MarginPurchaseTodayBalance;
    let short_change_5d = latest.ShortSaleTodayBalance - base.ShortSaleTodayBalance;
    let margin_change_percent_5d = if base.MarginPurchaseTodayBalance == 0 {
        0.0
    } else {
        margin_change_5d as f64 / base.MarginPurchaseTodayBalance as f64 * 100.0
    };
    let short_margin_ratio = if latest.MarginPurchaseTodayBalance == 0 {
        0.0
    } else {
        latest.ShortSaleTodayBalance as f64 / latest.MarginPurchaseTodayBalance as f64 * 100.0
    };
    Ok((
        MarginSummary {
            margin_balance: latest.MarginPurchaseTodayBalance,
            margin_change_5d,
            margin_change_percent_5d,
            short_balance: latest.ShortSaleTodayBalance,
            short_change_5d,
            short_margin_ratio,
        },
        latest.date.clone(),
    ))
}

fn build_history(
    institutional_rows: &[InstitutionalRow],
    margin_rows: &[MarginRow],
    price_rows: &[PriceRow],
) -> Vec<ChipDaily> {
    use std::collections::BTreeMap;

    let mut days: BTreeMap<String, ChipDaily> = BTreeMap::new();
    for row in institutional_rows {
        let day = days.entry(row.date.clone()).or_insert_with(|| ChipDaily {
            date: row.date.clone(),
            close: 0.0,
            foreign: 0,
            trust: 0,
            dealer: 0,
            institutional_total: 0,
            margin_balance: 0,
        });
        let net = row.buy - row.sell;
        day.institutional_total += net;
        match row.name.as_str() {
            "Foreign_Investor" | "Foreign_Dealer_Self" => day.foreign += net,
            "Investment_Trust" => day.trust += net,
            name if name.starts_with("Dealer") => day.dealer += net,
            _ => {}
        }
    }
    for row in margin_rows {
        if let Some(day) = days.get_mut(&row.date) {
            day.margin_balance = row.MarginPurchaseTodayBalance;
        }
    }
    for row in price_rows {
        if let Some(day) = days.get_mut(&row.date) {
            day.close = row.close;
        }
    }
    let mut history: Vec<ChipDaily> = days.into_values().filter(|day| day.close > 0.0).collect();
    if history.len() > 20 {
        history.drain(0..history.len() - 20);
    }
    history
}

fn detect_signals(history: &[ChipDaily]) -> Vec<String> {
    if history.len() < 6 {
        return vec![];
    }
    let recent = &history[history.len() - 5..];
    let start = recent.first().unwrap();
    let end = recent.last().unwrap();
    let institutional: i64 = recent.iter().map(|day| day.institutional_total).sum();
    let price_change = (end.close - start.close) / start.close * 100.0;
    let margin_change = if start.margin_balance == 0 {
        0.0
    } else {
        (end.margin_balance - start.margin_balance) as f64 / start.margin_balance as f64 * 100.0
    };
    let mut signals = Vec::new();
    if price_change < -2.0 && institutional > 0 {
        signals.push("price_down_institution_buy".to_string());
    }
    if price_change > 2.0 && institutional < 0 {
        signals.push("price_up_institution_sell".to_string());
    }
    if price_change > 2.0 && margin_change > 5.0 {
        signals.push("margin_chasing".to_string());
    }
    if recent.iter().rev().take(3).all(|day| day.trust > 0) {
        signals.push("trust_streak".to_string());
    }
    signals
}

fn build_lights(
    institutional: &InstitutionalSummary,
    shareholding_rows: &[ShareholdingRow],
    lending_rows: &[SecuritiesLendingRow],
) -> ChipLights {
    use std::collections::BTreeMap;

    let institutional_status = if institutional.total_5d > 0 {
        "buying"
    } else if institutional.total_5d < 0 {
        "selling"
    } else {
        "neutral"
    };

    let mut shareholding: Vec<&ShareholdingRow> = shareholding_rows.iter().collect();
    shareholding.sort_by(|a, b| b.date.cmp(&a.date));
    let foreign_ratio = shareholding
        .first()
        .map(|row| row.ForeignInvestmentSharesRatio);
    let foreign_change_5d = shareholding.first().and_then(|latest| {
        shareholding
            .get(5)
            .or_else(|| shareholding.last())
            .map(|base| latest.ForeignInvestmentSharesRatio - base.ForeignInvestmentSharesRatio)
    });
    let foreign_status = match foreign_change_5d {
        Some(change) if change >= 0.2 => "increasing",
        Some(change) if change <= -0.2 => "decreasing",
        Some(_) => "stable",
        None => "unavailable",
    };

    let mut lending_by_date: BTreeMap<&str, i64> = BTreeMap::new();
    for row in lending_rows {
        *lending_by_date.entry(&row.date).or_default() += row.volume;
    }
    let daily_volumes: Vec<i64> = lending_by_date.into_values().rev().collect();
    let recent: Vec<i64> = daily_volumes.iter().take(5).copied().collect();
    let previous: Vec<i64> = daily_volumes.iter().skip(5).take(15).copied().collect();
    let lending_volume_5d = recent.iter().sum();
    let recent_average = if recent.is_empty() {
        0.0
    } else {
        lending_volume_5d as f64 / recent.len() as f64
    };
    let previous_average = if previous.is_empty() {
        0.0
    } else {
        previous.iter().sum::<i64>() as f64 / previous.len() as f64
    };
    let lending_change_percent = if previous_average > 0.0 {
        Some((recent_average / previous_average - 1.0) * 100.0)
    } else {
        None
    };
    let lending_status = match lending_change_percent {
        Some(change) if change >= 50.0 => "high",
        Some(change) if change <= -30.0 => "easing",
        Some(_) => "normal",
        None => "unavailable",
    };

    let positive = [
        institutional_status == "buying",
        foreign_status == "increasing",
        lending_status == "easing",
    ]
    .into_iter()
    .filter(|value| *value)
    .count();
    let negative = [
        institutional_status == "selling",
        foreign_status == "decreasing",
        lending_status == "high",
    ]
    .into_iter()
    .filter(|value| *value)
    .count();
    let summary = if positive >= 2 && negative == 0 {
        "favorable"
    } else if negative >= 2 {
        "cautious"
    } else {
        "mixed"
    };

    ChipLights {
        institutional: institutional_status.to_string(),
        foreign_holding: foreign_status.to_string(),
        lending_pressure: lending_status.to_string(),
        summary: summary.to_string(),
        foreign_ratio,
        foreign_change_5d,
        lending_volume_5d,
        lending_change_percent,
    }
}

fn calculate_verdict(
    institutional: &InstitutionalSummary,
    margin: &MarginSummary,
) -> (i32, String, String, Vec<ScoreBreakdown>) {
    let mut score = 50;
    let foreign = if institutional.foreign_5d > 0 {
        15
    } else {
        -15
    };
    let trust = if institutional.trust_5d > 0 { 10 } else { -10 };
    let dealer = if institutional.dealer_5d > 0 { 5 } else { -5 };
    let medium_term = if institutional.total_20d > 0 { 10 } else { -10 };
    let margin_points = if margin.margin_change_percent_5d <= 0.0 {
        5
    } else {
        -5
    };
    let score_breakdown = vec![
        ScoreBreakdown {
            factor: "foreign_5d".to_string(),
            points: foreign,
        },
        ScoreBreakdown {
            factor: "trust_5d".to_string(),
            points: trust,
        },
        ScoreBreakdown {
            factor: "dealer_5d".to_string(),
            points: dealer,
        },
        ScoreBreakdown {
            factor: "institutional_20d".to_string(),
            points: medium_term,
        },
        ScoreBreakdown {
            factor: "margin_5d".to_string(),
            points: margin_points,
        },
    ];
    score += foreign + trust + dealer + medium_term + margin_points;
    score = score.clamp(0, 100);
    let verdict = if institutional.total_5d < 0 && margin.margin_change_percent_5d > 5.0 {
        "retail_crowded"
    } else if score >= 65 {
        "stable_buying"
    } else if score <= 35 {
        "distribution"
    } else {
        "mixed"
    };
    (
        score,
        verdict.to_string(),
        "medium".to_string(),
        score_breakdown,
    )
}

#[tauri::command]
pub async fn get_chip_data(symbol: String) -> Result<ChipData, String> {
    if !symbol.chars().all(|char| char.is_ascii_digit()) {
        return Err("CHIP_DATA_TW_ONLY".to_string());
    }
    let cache = CACHE.get_or_init(DashMap::new);
    if let Some(entry) = cache.get(&symbol) {
        if entry.value().1.elapsed() < Duration::from_secs(1800) {
            return Ok(entry.value().0.clone());
        }
    }
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(15))
        .user_agent("Schoice/0.0.28")
        .build()
        .map_err(|error| error.to_string())?;
    let start_date = (Local::now().date_naive() - ChronoDuration::days(60))
        .format("%Y-%m-%d")
        .to_string();
    let (institutional_result, margin_result, price_result, shareholding_result, lending_result) = tokio::join!(
        fetch_dataset::<InstitutionalRow>(
            &client,
            "TaiwanStockInstitutionalInvestorsBuySell",
            &symbol,
            &start_date,
        ),
        fetch_dataset::<MarginRow>(
            &client,
            "TaiwanStockMarginPurchaseShortSale",
            &symbol,
            &start_date,
        ),
        fetch_dataset::<PriceRow>(&client, "TaiwanStockPrice", &symbol, &start_date),
        fetch_dataset::<ShareholdingRow>(&client, "TaiwanStockShareholding", &symbol, &start_date,),
        fetch_dataset::<SecuritiesLendingRow>(
            &client,
            "TaiwanStockSecuritiesLending",
            &symbol,
            &start_date,
        ),
    );
    let institutional_rows = institutional_result?;
    let margin_rows = margin_result?;
    let price_rows = price_result?;
    let shareholding_rows = shareholding_result.unwrap_or_default();
    let lending_rows = lending_result.unwrap_or_default();
    let (institutional, institutional_date) = summarize_institutional(&institutional_rows)?;
    let (margin, margin_date) = summarize_margin(&margin_rows)?;
    let as_of = std::cmp::min(institutional_date, margin_date);
    let history = build_history(&institutional_rows, &margin_rows, &price_rows);
    let signals = detect_signals(&history);
    let (score, verdict, confidence, score_breakdown) = calculate_verdict(&institutional, &margin);
    let lights = build_lights(&institutional, &shareholding_rows, &lending_rows);
    let data = ChipData {
        symbol: symbol.clone(),
        as_of,
        score,
        verdict,
        confidence,
        institutional,
        margin,
        history,
        signals,
        score_breakdown,
        lights,
        source: "FinMind".to_string(),
    };
    cache.insert(symbol, (data.clone(), Instant::now()));
    Ok(data)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn verdict_detects_retail_crowding() {
        let institutional = InstitutionalSummary {
            foreign_5d: -10,
            trust_5d: -10,
            dealer_5d: -10,
            total_5d: -30,
            total_20d: -50,
            consecutive_days: -3,
        };
        let margin = MarginSummary {
            margin_balance: 100,
            margin_change_5d: 10,
            margin_change_percent_5d: 10.0,
            short_balance: 2,
            short_change_5d: 0,
            short_margin_ratio: 2.0,
        };
        let (_, verdict, _, _) = calculate_verdict(&institutional, &margin);
        assert_eq!(verdict, "retail_crowded");
    }

    #[test]
    fn verdict_detects_stable_buying() {
        let institutional = InstitutionalSummary {
            foreign_5d: 10,
            trust_5d: 10,
            dealer_5d: 10,
            total_5d: 30,
            total_20d: 50,
            consecutive_days: 3,
        };
        let margin = MarginSummary {
            margin_balance: 100,
            margin_change_5d: -5,
            margin_change_percent_5d: -5.0,
            short_balance: 2,
            short_change_5d: 0,
            short_margin_ratio: 2.0,
        };
        let (score, verdict, _, breakdown) = calculate_verdict(&institutional, &margin);
        assert!(score >= 65);
        assert_eq!(verdict, "stable_buying");
        assert_eq!(breakdown.len(), 5);
    }

    #[test]
    fn detects_price_institutional_divergence() {
        let history: Vec<ChipDaily> = (0..6)
            .map(|index| ChipDaily {
                date: format!("2026-07-{}", 10 + index),
                close: 100.0 - index as f64,
                foreign: 2_000,
                trust: 1_000,
                dealer: 0,
                institutional_total: 3_000,
                margin_balance: 10_000,
            })
            .collect();

        assert!(detect_signals(&history).contains(&"price_down_institution_buy".to_string()));
    }

    #[test]
    fn lights_detect_improving_positioning() {
        let institutional = InstitutionalSummary {
            foreign_5d: 10,
            trust_5d: 10,
            dealer_5d: 0,
            total_5d: 20,
            total_20d: 50,
            consecutive_days: 2,
        };
        let shareholding = vec![
            ShareholdingRow {
                date: "2026-07-30".to_string(),
                ForeignInvestmentSharesRatio: 40.4,
            },
            ShareholdingRow {
                date: "2026-07-23".to_string(),
                ForeignInvestmentSharesRatio: 40.0,
            },
        ];
        let lending: Vec<SecuritiesLendingRow> = (0..6)
            .map(|index| SecuritiesLendingRow {
                date: format!("2026-07-{}", 25 + index),
                volume: if index == 0 { 100 } else { 50 },
            })
            .collect();

        let lights = build_lights(&institutional, &shareholding, &lending);
        assert_eq!(lights.institutional, "buying");
        assert_eq!(lights.foreign_holding, "increasing");
        assert_eq!(lights.lending_pressure, "easing");
        assert_eq!(lights.summary, "favorable");
    }
}
