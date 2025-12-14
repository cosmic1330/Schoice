import { useEffect } from "react";
import { stockFundamentalQueryBuilder } from "../classes/StockFundamentalQueryBuilder";
import useCloudStore from "../store/Cloud.store";
import useSchoiceStore from "../store/Schoice.store";
import { StockTableType } from "../types";
import useDatabaseQuery from "./useDatabaseQuery";

export default function useInitFilterStock() {
  const { fundamentalCondition } = useCloudStore();
  const { setFilterStocks } = useSchoiceStore();
  const query = useDatabaseQuery();

  useEffect(() => {
    if (!fundamentalCondition) return;
    stockFundamentalQueryBuilder
      .getStocksByConditions({ conditions: fundamentalCondition })
      .then((stockIds) => {
        if (stockIds.length === 0) {
          setFilterStocks([]);
        }
        query(`SELECT * FROM stock WHERE stock_id IN (${stockIds.map((id) => `'${id}'`).join(",")})`).then(
          (data: StockTableType[] | null) => {
            if (!data || data.length === 0) {
              setFilterStocks([]);
            }
            setFilterStocks(data);
          }
        );
      });
  }, [fundamentalCondition]);
}
