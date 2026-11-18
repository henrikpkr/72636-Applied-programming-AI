"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function Card({ title, children }) {
  return (
    <section style={{ background: "white", borderRadius: 8, padding: 16, boxShadow: "0 1px 3px #0001" }}>
      <h2 style={{ fontSize: 16, marginTop: 0 }}>{title}</h2>
      <div style={{ height: 300 }}>{children}</div>
    </section>
  );
}

// Vertical bars: category on the Y axis so long genre names stay readable.
function HBar({ data, valueKey, labelKey, color, format }) {
  return (
    <ResponsiveContainer>
      <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" />
        <YAxis type="category" dataKey={labelKey} width={130} tick={{ fontSize: 12 }} interval={0} />
        <Tooltip formatter={format} />
        <Bar dataKey={valueKey} fill={color} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function VBar({ data, valueKey, labelKey, color }) {
  return (
    <ResponsiveContainer>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={labelKey} />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey={valueKey} fill={color} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function Charts({ topCategories, priciestCategories, ratings, priceBins }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))", gap: 16 }}>
      <Card title="Genre distribution (top 10 categories)">
        <HBar data={topCategories} labelKey="name" valueKey="count" color="#4f46e5" />
      </Card>
      <Card title="Average price by category (£, categories with 3+ books)">
        <HBar data={priciestCategories} labelKey="name" valueKey="avgPrice" color="#0891b2" format={(v) => `£${v}`} />
      </Card>
      <Card title="Rating distribution">
        <VBar data={ratings} labelKey="rating" valueKey="count" color="#f59e0b" />
      </Card>
      <Card title="Price distribution">
        <VBar data={priceBins} labelKey="range" valueKey="count" color="#10b981" />
      </Card>
    </div>
  );
}
