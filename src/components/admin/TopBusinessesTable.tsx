"use client";

interface TopBusiness {
  id: string;
  name: string;
  revenue: number;
  orders: number;
  products: number;
}

interface TopBusinessesTableProps {
  businesses: TopBusiness[];
}

export const TopBusinessesTable = ({ businesses }: TopBusinessesTableProps) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Business</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Revenue</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Orders</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Products</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {businesses.map((biz) => (
            <tr key={biz.id}>
              <td className="px-4 py-3 font-medium text-foreground">{biz.name}</td>
              <td className="px-4 py-3 text-right text-muted-foreground">
                ${(biz.revenue / 100).toFixed(2)}
              </td>
              <td className="px-4 py-3 text-right text-muted-foreground">{biz.orders}</td>
              <td className="px-4 py-3 text-right text-muted-foreground">{biz.products}</td>
            </tr>
          ))}
          {businesses.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                No data yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
