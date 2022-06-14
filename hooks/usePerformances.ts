import { differenceInMinutes, parseISO } from "date-fns";
import useSWR from "swr";
import { IPerformance } from "../types/performance";

async function fetcher() {
  const response = await fetch('/api/performances');

  const data = await response.json();

  return data.map((performance) => {
    const start = parseISO(performance.start);
    const end = parseISO(performance.end);
    const minutes = differenceInMinutes(end, start);
    const blocks = minutes / 15;

    return {
      ...performance,
      start,
      end,
      minutes,
      blocks,
    };
  })
}

export function usePerformances() {
  const { data: performances = [], isValidating } = useSWR<IPerformance[]>('performances', fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
  });

  return [performances, isValidating] as const;
}
