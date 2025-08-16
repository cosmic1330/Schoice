import { useEffect } from "react";
import { stockFundamentalQueryBuilder } from "../classes/StockFundamentalQueryBuilder";
import useCloudStore from "../store/Cloud.store";
import useSchoiceStore from "../store/Schoice.store";
import { supabase } from "../tools/supabase";
import { StockTableType } from "../types";

export default function useInitFilterStock() {
  const { fundamentalCondition } = useCloudStore();
  const { setFilterStocks } = useSchoiceStore();

  useEffect(() => {
    if (!fundamentalCondition) return;
    stockFundamentalQueryBuilder
      .getStocksByConditions({ conditions: fundamentalCondition })
      .then((stockIds) => {
        if (stockIds.length === 0) {
          setFilterStocks([]);
          return;
        }
        return supabase
          .from("stock")
          .select("*")
          .in("stock_id", stockIds)
          .then(({ data }: { data: StockTableType[] | null }) => {
            if (!data || data.length === 0) {
              setFilterStocks([]);
              return;
            }
            setFilterStocks(data);
          });
      });
  }, [fundamentalCondition]);
}
