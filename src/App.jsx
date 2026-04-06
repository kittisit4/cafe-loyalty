import { useState, useEffect } from "react";

const STAMP_GOAL = 10;
const STAFF_PIN = "1234";

const load = () => {
  try { return JSON.parse(localStorage.getItem("loyalty_customers")) || []; }
  catch { return []; }
};
const save = (data) => localStorage.setItem("loyalty_customers", JSON.stringify(data));

const Cup = ({ filled, size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <path d="M8 12 Q8 8 20 8 Q32 8 32 12 L30 30 Q30 32 20 32 Q10 32 10 30 Z"
      fill={filled ? "#c8813a" : "#2e1f0e"} stroke={filled ? "#a0622a" : "#3d2b1a"} strokeWidth="1.2" />
    <path d="M32 16 Q38 16 38 21 Q38 26 32 26" stroke={filled ? "#a0622a" : "#3d2b1a"} strokeWidth="2" fill="none" strokeLinecap="round" />
    <ellipse cx="20" cy="12" rx="12" ry="3" fill={filled ? "#e09a52" : "#3d2b1a"} />
  </svg>
);
function PinGate({ onUnlock }) {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);

  const attempt = (val) => {
    if (val === STAFF_PIN) { onUnlock(); }
    else {
      setShake(true);
      setTimeout(() => { setShake(false); setPin(""); }, 600);
    }
  };

  const press = (d) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) setTimeout(() => attempt(next), 100);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 32 }}>
      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }`}</style>
      <div style={{ fontSize: 10, letterSpacing: 5, color: "#6f4e37", textTransform: "uppercase", marginBottom: 8 }}>Staff Access</div>
      <div style={{ fontSize: 28, color: "#d4a96a", marginBottom: 40 }}>☕ Enter PIN</div>
      <div style={{ display: "flex", gap: 16, marginBottom: 40, animation: shake ? "shake 0.5s ease" : "none" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{
            width: 18, height: 18, borderRadius: "50%",
            background: i < pin.length ? "#d4a96a" : "transparent",
            border: "2px solid " + (i < pin.length ? "#d4a96a" : "#6f4e37"),
            transition: "all 0.15s"
          }} />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, width: 240 }}>
        {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d, i) => (
          <button key={i} onClick={() => {
            if (d === "⌫") setPin(p => p.slice(0, -1));
            else if (d !== "") press(String(d));
          }} style={{
            background: d === "" ? "transparent" : "#2a1c0e",
            border: d === "" ? "none" : "1px solid #3d2b1a",
            color: "#f5ede0", fontSize: 22, padding: "18px 0",
            borderRadius: 12, cursor: d === "" ? "default" : "pointer"
          }}>
            {d}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 24, fontSize: 12, color: "#3d2b1a" }}>Default PIN: 1234</div>
    </div>
  );
}
export default function CafeLoyalty() {
  const [unlocked, setUnlocked] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [newName, setNewName] = useState("");
  const [toast, setToast] = useState(null);
  const [animIdx, setAnimIdx] = useState(null);
  const [confirmRedeem, setConfirmRedeem] = useState(false);

  useEffect(() => { setCustomers(load()); }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const updateCustomers = (fn) => {
    setCustomers(prev => { const next = fn(prev); save(next); return next; });
  };

  const current = customers.find(c => c.id === selectedId) || null;

  const addStamp = () => {
    if (!current || current.stamps >= STAMP_GOAL) return;
    setAnimIdx(current.stamps);
    setTimeout(() => setAnimIdx(null), 700);
    updateCustomers(prev => prev.map(c => c.id === selectedId ? { ...c, stamps: c.stamps + 1 } : c));
    if (current.stamps + 1 === STAMP_GOAL) showToast("🎉 Free coffee unlocked!", "reward");
    else showToast(`☕ Stamp ${current.stamps + 1} of ${STAMP_GOAL} added!`);
  };

  const redeemFree = () => {
    updateCustomers(prev => prev.map(c => c.id === selectedId ? { ...c, stamps: 0, redeemed: (c.redeemed || 0) + 1 } : c));
    setConfirmRedeem(false);
    showToast("✅ Enjoy the free coffee! Card reset.", "info");
  };

  const addCustomer = () => {
    const name = newName.trim();
    if (!name) return;
    if (customers.find(c => c.name.toLowerCase() === name.toLowerCase())) {
      showToast("Name already exists", "error"); return;
    }
    const c = { id: Date.now(), name, stamps: 0, redeemed: 0 };
    updateCustomers(prev => [...prev, c]);
    setNewName("");
    showToast(`✨ ${name} added!`);
  };

  const filtered = customers
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (!unlocked) return (
    <div style={{ fontFamily: "'Georgia', serif", minHeight: "100vh", background: "#1a1108", color: "#f5ede0" }}>
      <PinGate onUnlock={() => setUnlocked(true)} />
    </div>
  );
  return (
    <div style={{ fontFamily: "'Georgia', serif", minHeight: "100vh", background: "#1a1108", color: "#f5ede0" }}>
      <style>{`
        @keyframes pop { 0%{transform:scale(1)} 40%{transform:scale(1.45)} 100%{transform:scale(1)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0;transform:translateX(-50%) translateY(-6px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        input::placeholder{color:#5a4535} input:focus{outline:none}
        ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-thumb{background:#6f4e37;border-radius:4px}
      `}</style>

      {toast && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: toast.type === "reward" ? "#7a4f1e" : toast.type === "error" ? "#5c1a1a" : "#2a1c0e",
          border: `1px solid ${toast.type === "reward" ? "#d4a96a" : toast.type === "error" ? "#c0392b" : "#6f4e37"}`,
          borderRadius: 12, padding: "12px 22px", fontSize: 14, zIndex: 999,
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)", animation: "fadeIn 0.3s ease", whiteSpace: "nowrap"
        }}>{toast.msg}</div>
      )}

      {confirmRedeem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#2a1c0e", border: "1px solid #d4a96a", borderRadius: 20, padding: 32, maxWidth: 300, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎁</div>
            <div style={{ fontSize: 20, color: "#d4a96a", marginBottom: 8 }}>Redeem Free Coffee?</div>
            <div style={{ fontSize: 13, color: "#8a7060", marginBottom: 28 }}>This resets {current?.name}'s card to 0 stamps.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmRedeem(false)} style={{ flex: 1, background: "transparent", border: "1px solid #6f4e37", color: "#f5ede0", padding: 14, borderRadius: 10, fontSize: 15, cursor: "pointer" }}>Cancel</button>
              <button onClick={redeemFree} style={{ flex: 1, background: "#d4a96a", border: "none", color: "#1a1108", padding: 14, borderRadius: 10, fontSize: 15, fontWeight: "bold", cursor: "pointer" }}>Confirm ✓</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #2e1f0e", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 5, color: "#6f4e37", textTransform: "uppercase" }}>Loyalty Program</div>
          <div style={{ fontSize: 24, color: "#d4a96a" }}>☕ The Loyal Cup</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {current && (
            <button onClick={() => { setSelectedId(null); setSearch(""); }} style={{ background: "transparent", border: "1px solid #3d2b1a", color: "#8a7060", padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>← Back</button>
          )}
          <button onClick={() => setUnlocked(false)} style={{ background: "transparent", border: "1px solid #2e1f0e", color: "#3d2b1a", padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>Lock</button>
        </div>
      </div>

      {!current && (
        <div style={{ padding: "20px 24px", animation: "slideUp 0.3s ease" }}>
          <div style={{ fontSize: 10, letterSpacing: 4, color: "#6f4e37", textTransform: "uppercase", marginBottom: 10 }}>Find Customer</div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name…"
            style={{ width: "100%", boxSizing: "border-box", background: "#2a1c0e", border: "1px solid #3d2b1a", color: "#f5ede0", padding: "13px 16px", borderRadius: 10, fontSize: 17, marginBottom: 14 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "38vh", overflowY: "auto" }}>
            {filtered.length === 0 && <div style={{ color: "#4a3728", textAlign: "center", padding: 24, fontSize: 14 }}>No customers found</div>}
            {filtered.map(c => (
              <div key={c.id} onClick={() => setSelectedId(c.id)}
                style={{ background: "#2a1c0e", border: "1px solid #2e1f0e", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", transition: "border-color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#6f4e37"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#2e1f0e"}
              >
                <div>
                  <div style={{ fontSize: 17 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: c.stamps >= STAMP_GOAL ? "#d4a96a" : "#6f4e37", marginTop: 2 }}>
                    {c.stamps >= STAMP_GOAL ? "🎉 Free coffee ready!" : `${c.stamps} / ${STAMP_GOAL} stamps`}
                    {c.redeemed > 0 && ` · ${c.redeemed}x redeemed`}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 2 }}>
                  {Array.from({ length: STAMP_GOAL }).map((_, i) => <Cup key={i} filled={i < c.stamps} size={13} />)}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            {[
              { label: "Customers", val: customers.length },
              { label: "Ready", val: customers.filter(c => c.stamps >= STAMP_GOAL).length },
              { label: "Redeemed", val: customers.reduce((a, c) => a + (c.redeemed || 0), 0) }
            ].map(s => (
              <div key={s.label} style={{ flex: 1, background: "#2a1c0e", border: "1px solid #2e1f0e", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 22, color: "#d4a96a" }}>{s.val}</div>
                <div style={{ fontSize: 10, color: "#6f4e37", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18, borderTop: "1px solid #2e1f0e", paddingTop: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: 4, color: "#6f4e37", textTransform: "uppercase", marginBottom: 10 }}>New Customer</div>
            <div style={{ display: "flex", gap: 10 }}>
              <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && addCustomer()} placeholder="Customer name…"
                style={{ flex: 1, background: "#2a1c0e", border: "1px solid #3d2b1a", color: "#f5ede0", padding: "12px 16px", borderRadius: 10, fontSize: 16 }} />
              <button onClick={addCustomer} style={{ background: "#8B5E3C", border: "none", color: "#f5ede0", padding: "12px 20px", borderRadius: 10, fontSize: 15, cursor: "pointer" }}>Add +</button>
            </div>
          </div>
        </div>
      )}

      {current && (
        <div style={{ padding: "24px", animation: "slideUp 0.3s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 26 }}>{current.name}</div>
              <div style={{ fontSize: 12, color: "#6f4e37", marginTop: 2 }}>
                {current.stamps >= STAMP_GOAL ? "🎉 Free coffee is ready!" : `${STAMP_GOAL - current.stamps} more stamp${STAMP_GOAL - current.stamps !== 1 ? "s" : ""} to go`}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 26, color: "#d4a96a" }}>{current.stamps}<span style={{ fontSize: 14, color: "#6f4e37" }}>/{STAMP_GOAL}</span></div>
            </div>
          </div>
          <div style={{ background: "#2a1c0e", border: "1px solid #2e1f0e", borderRadius: 16, padding: "24px 20px", marginBottom: 20, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
            {Array.from({ length: STAMP_GOAL }).map((_, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, animation: animIdx === i ? "pop 0.6s ease" : "none" }}>
                <Cup filled={i < current.stamps} size={40} />
                <div style={{ fontSize: 10, color: i < current.stamps ? "#d4a96a" : "#3d2b1a" }}>{i + 1}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "#2a1c0e", borderRadius: 99, height: 6, marginBottom: 20, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 99, background: "linear-gradient(90deg, #8B5E3C, #d4a96a)", width: `${(current.stamps / STAMP_GOAL) * 100}%`, transition: "width 0.5s ease" }} />
          </div>
          {current.stamps < STAMP_GOAL && (
            <button onClick={addStamp} style={{ width: "100%", background: "#8B5E3C", border: "none", color: "#f5ede0", padding: 18, borderRadius: 12, fontSize: 18, cursor: "pointer" }}>
              ☕ Add Stamp
            </button>
          )}
          {current.stamps >= STAMP_GOAL && (
            <button onClick={() => setConfirmRedeem(true)} style={{ width: "100%", background: "#d4a96a", border: "none", color: "#1a1108", padding: 18, borderRadius: 12, fontSize: 18, fontWeight: "bold", cursor: "pointer" }}>
              🎁 Redeem Free Coffee
            </button>
          )}
          {current.redeemed > 0 && (
            <div style={{ marginTop: 14, textAlign: "center", fontSize: 12, color: "#4a3728" }}>
              {current.name} has redeemed {current.redeemed} free coffee{current.redeemed !== 1 ? "s" : ""} 🏆
            </div>
          )}
        </div>
      )}
    </div>
  );
}
