import ResultTable from "../../../components/ResultTable/ResultTable";
import useSchoiceStore from "../../../store/Schoice.store";

export default function FundamentalResult() {
  const { filterStocks } = useSchoiceStore();

  return <ResultTable result={filterStocks || []} />;
}
