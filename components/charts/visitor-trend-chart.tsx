import { Line } from "@/components/ui/chart";

interface VisitorTrendChartProps {
  data: { date: string; visitors: number }[];
}

export function VisitorTrendChart({ data }: VisitorTrendChartProps) {
  return (
    <Line
      data={{
        labels: data.map((item) => item.date),
        datasets: [
          {
            label: "방문자 수",
            data: data.map((item) => item.visitors),
            borderColor: "rgb(99, 102, 241)",
            backgroundColor: "rgba(99, 102, 241, 0.2)",
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 4,
            fill: true,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              padding: 20,
              usePointStyle: true,
              pointStyle: "circle",
              font: { size: 14 },
            },
            margin: 24,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { font: { size: 14 } },
            grid: { color: "rgba(0, 0, 0, 0.05)" },
          },
          x: {
            ticks: { font: { size: 14 } },
            grid: { display: false },
          },
        },
        animation: { duration: 1000, easing: "easeInOutQuart" },
        layout: { padding: { top: 16, bottom: 16 } },
      }}
      className="h-full w-full"
    />
  );
}
