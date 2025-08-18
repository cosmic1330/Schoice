import ResultTable from "../../../components/ResultTable/ResultTable";
import useSchoiceStore from "../../../store/Schoice.store";

export default function FundamentalResult() {
  const { filterStocks } = useSchoiceStore();

  return filterStocks && filterStocks.length > 0 ? (
    <ResultTable result={filterStocks} />
  ) : (
    <div></div>
  ) ;
}
