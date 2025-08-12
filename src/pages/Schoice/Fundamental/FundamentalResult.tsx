import { useContext, useEffect, useState } from "react";
import ResultTable from "../../../components/ResultTable/ResultTable";
import { DatabaseContext } from "../../../context/DatabaseContext";
import useFindStocksByPrompt from "../../../hooks/useFindStocksByPrompt";
import useSchoiceStore from "../../../store/Schoice.store";

export default function FundamentalResult() {
  const { filterStocks, todayDate } = useSchoiceStore();
  
  const { dates } = useContext(DatabaseContext);
  const [result, setResult] = useState<any[]>([]);
  const { getStocksData } = useFindStocksByPrompt();

  useEffect(() => {
    if (!filterStocks) return;
    if (dates?.length === 0 || filterStocks?.length === 0) return;
    getStocksData(
      dates[todayDate],
      filterStocks.map((r) => r.id)
    ).then((result) => {
      if (result) setResult(result);
    });
  }, [filterStocks, dates, getStocksData]);

  return <ResultTable {...{ result }} />;
}
