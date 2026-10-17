import { supabase } from "../lib/supabase";
import type { TdccHolderTableType } from "../types";

export const getTdccStockId = (symbol: string | undefined): number | null => {
  const match = symbol?.match(/^(\d+)(?:\.TW)?$/i);
  if (!match) return null;

  const stockId = Number(match[1]);
  return Number.isSafeInteger(stockId) ? stockId : null;
};

export async function getTdccHolder(
  symbol: string | undefined,
): Promise<TdccHolderTableType | null> {
  const stockId = getTdccStockId(symbol);
  if (stockId === null) return null;

  const { data, error } = await supabase
    .from("tdcc_holder")
    .select(
      "stock_id,data_date,holders_100,holders_400,holders_1000,previous_date,previous_holders_100,previous_holders_400,previous_holders_1000",
    )
    .eq("stock_id", stockId)
    .maybeSingle();

  if (error) throw error;
  return data as TdccHolderTableType | null;
}
