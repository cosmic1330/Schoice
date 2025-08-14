import { useEffect } from "react";
import { stockFundamentalQueryBuilder } from "../classes/StockFundamentalQueryBuilder";
import useCloudStore from "../store/Cloud.store";
import useSchoiceStore from "../store/Schoice.store";
import useDatabaseQuery from "./useDatabaseQuery";
import { supabase } from "../tools/supabase";

export default function useInitFilterStock() {
  const { fundamentalCondition } = useCloudStore();
  const query = useDatabaseQuery();
  const { setFilterStocks } = useSchoiceStore();

  useEffect(() => {
    if (!fundamentalCondition) return;
    const conditions = fundamentalCondition.map((prompt) =>
      stockFundamentalQueryBuilder.generateExpression(prompt).join(" ")
    );
    const sqlQuery = stockFundamentalQueryBuilder.generateSqlQuery({
      conditions,
    });
    query(sqlQuery).then((res) => {
      if (res) {
        supabase
          .from("stock")
          .select("*")
          .in(
            "stock_id",
            res.map((r) => r.stock_id)
          )
          .then(({ data }) => {
            setFilterStocks(data || null);
          });
      }
    });
  }, [fundamentalCondition]);
}
