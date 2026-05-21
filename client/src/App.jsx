import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function App() {
  const API = "https://budget-tracker-mmvz.onrender.com";

  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("food");

  const [salary, setSalary] = useState("");
  const [salaryType, setSalaryType] = useState("yearly");

  const [stateTax, setStateTax] = useState("");
  const [retirement, setRetirement] = useState("");
  const [health, setHealth] = useState("");

  const [budgetName, setBudgetName] = useState("");

  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const format = (num) => `$${Number(num || 0).toFixed(2)}`;

  const getYearlyIncome = () => {
    const val = Number(salary);
    if (!val) return 0;

    if (salaryType === "weekly") return val * 52;
    if (salaryType === "biweekly") return val * 26;
    if (salaryType === "monthly") return val * 12;

    return val;
  };

  const yearlyIncome = getYearlyIncome();
  const monthlyIncome = yearlyIncome / 12;

  const federalTax = (income) => {
    const brackets = [
      { limit: 11000, rate: 0.1 },
      { limit: 44725, rate: 0.12 },
      { limit: 95375, rate: 0.22 },
      { limit: Infinity, rate: 0.24 },
    ];

    let tax = 0;
    let prev = 0;

    for (let b of brackets) {
      if (income > b.limit) {
        tax += (b.limit - prev) * b.rate;
        prev = b.limit;
      } else {
        tax += (income - prev) * b.rate;
        break;
      }
    }

    return tax;
  };

  const federalRate =
    yearlyIncome > 0
      ? (federalTax(yearlyIncome) / yearlyIncome) * 100
      : 0;

  const totalPercent =
    federalRate + Number(stateTax || 0) + 7.65 + Number(retirement || 0);

  const monthlyNet =
    (yearlyIncome * (1 - totalPercent / 100)) / 12 -
    Number(health || 0);

  const filteredTransactions = transactions.filter((t) => {
    const d = new Date(t.created_at);

    const matchMonth =
      selectedMonth === "" || d.getMonth() == selectedMonth;

    const matchYear =
      selectedYear === "" || d.getFullYear() == selectedYear;

    return matchMonth && matchYear;
  });

  const expenseTotal = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const remaining = monthlyNet - expenseTotal;

  const pieData = (() => {
    const grouped = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => {
        const key = t.category || "other";
        if (!acc[key]) acc[key] = 0;
        acc[key] += Number(t.amount);
        return acc;
      }, {});

    const data = Object.entries(grouped).map(([k, v]) => ({
      name: k,
      value: v,
    }));

    const totalExpenses = data.reduce((sum, d) => sum + d.value, 0);
    const remainingIncome = yearlyIncome - totalExpenses;

    if (remainingIncome > 0) {
      data.push({ name: "savings", value: remainingIncome });
    }

    return data;
  })();

  const colors = {
    food: "#22c55e",
    rent: "#ef4444",
    entertainment: "#3b82f6",
    transport: "#f59e0b",
    other: "#a855f7",
    savings: "#10b981",
  };

  const getTransactions = async () => {
  setLoading(true);
  const res = await fetch(`${API}/transactions`);
  const data = await res.json();
  setTransactions(data);
  setLoading(false);
};
  const getBudgets = async () => {
    const res = await fetch(`${API}/budgets`);
    setBudgets(await res.json());
  };

  const addTransaction = async () => {
    if (!description || !amount) return;

    await fetch(`${API}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        description,
        amount,
        type,
        category,
      }),
    });

    setDescription("");
    setAmount("");
    getTransactions();
  };

  const deleteTransaction = async (id) => {
    await fetch(`${API}/transactions/${id}`, {
      method: "DELETE",
    });
    getTransactions();
  };

  useEffect(() => {
    getTransactions();
    getBudgets();
  }, []);

  const card = {
    background: "#1f2937",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "20px",
  };

  const input = {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #374151",
    background: "#111827",
    color: "white",
    width: "100%",
  };

  const button = {
    padding: "8px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  };

  if (loading) {
  return <h2 style={{ textAlign: "center" }}>Loading...</h2>;
}
  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", color: "white", padding: "20px" }}>
      <div style={{ maxWidth: "700px", margin: "auto" }}>
        <h1 style={{ textAlign: "center" }}>Jose's Budgets</h1>

        {/* INCOME */}
        <div style={card}>
          <h2>Income</h2>
          <input style={input} placeholder="Amount" value={salary} onChange={(e) => setSalary(e.target.value)} />
          <select style={input} value={salaryType} onChange={(e) => setSalaryType(e.target.value)}>
            <option value="yearly">Yearly</option>
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
          </select>
        </div>

        {/* SAVE */}
        <div style={card}>
          <h2>Save Budget</h2>
          <input style={input} placeholder="Budget Name" value={budgetName} onChange={(e) => setBudgetName(e.target.value)} />
          <button style={button} onClick={async () => {
            await fetch(`${API}/budgets`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: budgetName,
                income: salary,
                income_type: salaryType,
                state_tax: stateTax,
                retirement,
                health,
              }),
            });
            getBudgets();
          }}>
            Save
          </button>
        </div>

        {/* LOAD */}
        <div style={card}>
          <h2>Load Budget</h2>
          <select style={input} onChange={(e) => {
            const b = budgets.find(x => x.id == e.target.value);
            if (!b) return;
            setSalary(b.income);
            setSalaryType(b.income_type);
            setStateTax(b.state_tax);
            setRetirement(b.retirement);
            setHealth(b.health);
          }}>
            <option>Select Budget</option>
            {budgets.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* FILTER */}
        <div style={card}>
          <h2>Filter</h2>
          <select style={input} onChange={(e) => setSelectedMonth(e.target.value)}>
            <option value="">All Months</option>
            {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m,i)=>(
              <option key={i} value={i}>{m}</option>
            ))}
          </select>

          <input style={input} placeholder="Year" onChange={(e)=>setSelectedYear(e.target.value)} />
        </div>

        {/* SUMMARY */}
        <div style={card}>
          <h2>Summary</h2>
          <p>Monthly Net: {format(monthlyNet)}</p>
          <p>Remaining: {format(remaining)}</p>
        </div>

        {/* PIE */}
        <div style={card}>
          <h2>📊 Income Allocation</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value">
                {pieData.map((entry,i)=>(
                  <Cell key={i} fill={colors[entry.name] || "#888"} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* ADD */}
        <div style={card}>
          <h2>Add Transaction</h2>
          <input style={input} placeholder="Description" value={description} onChange={(e)=>setDescription(e.target.value)} />
          <input style={input} placeholder="Amount" value={amount} onChange={(e)=>setAmount(e.target.value)} />

          <select style={input} value={type} onChange={(e)=>setType(e.target.value)}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>

          <select style={input} value={category} onChange={(e)=>setCategory(e.target.value)}>
            <option value="food">Food</option>
            <option value="rent">Rent</option>
            <option value="entertainment">Entertainment</option>
            <option value="transport">Transport</option>
            <option value="other">Other</option>
          </select>

          <button style={button} onClick={addTransaction}>Add</button>
        </div>

        {/* LIST */}
        <div style={card}>
          <h2>Transactions</h2>
          {filteredTransactions.map((t)=>(
            <div key={t.id} style={{display:"flex",justifyContent:"space-between"}}>
              {t.description} - {format(t.amount)} ({t.category})
              <button onClick={()=>deleteTransaction(t.id)}>❌</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;