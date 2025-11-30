// frontend/src/App.js
import React, {useState} from "react";
import "./App.css";

function App(){
  const [form, setForm] = useState({
    Age: "", // allow raw age (recommended)
    Stress: "", // raw stress 1-10 OR select Low/Med/High (we will send raw)
    Genetics: "", Hormonal_Changes: "", Medical_Conditions: "",
    Medications_and_Treatments: "", Nutritional_Deficiencies: "",
    Poor_Hair_Care_Habits: "", Environmental_Factors: "", Smoking: "", Weight_Loss: ""
  });
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handle = (e) => {
    const {name, value} = e.target;
    setForm(prev => ({...prev, [name]: value}));
  };

  const validateBeforeSend = () => {
    // Age optional? require it
    if (form.Age === "" || Number(form.Age) < 10 || Number(form.Age) > 100) {
      setError("Please enter Age between 10 and 100.");
      return false;
    }
    // Stress must be either number 1-10 or one of strings Low/Medium/High
    const s = form.Stress;
    if (s === "" ) { setError("Please provide Stress (1-10 or Low/Medium/High)"); return false; }
    if (!isNaN(Number(s))) {
      const n = Number(s);
      if (n < 0 || n > 10) { setError("Stress must be between 0 and 10"); return false; }
    }
    // binaries
    const binFields = ["Genetics","Hormonal_Changes","Medical_Conditions","Medications_and_Treatments",
                       "Nutritional_Deficiencies","Poor_Hair_Care_Habits","Environmental_Factors","Smoking","Weight_Loss"];
    for (let f of binFields){
      if (!(form[f]==="0" || form[f]==="1" || form[f]===0 || form[f]===1 || form[f]==="Yes" || form[f]==="No" || form[f]==="")) {
        setError(`Please choose Yes/No for ${f}`);
        return false;
      }
      // allow empty? force choose
      if (form[f]==="") { setError(`Please choose Yes/No for ${f}`); return false; }
    }
    return true;
  };

  const submit = async () => {
    setError(""); setResult(null);
    if (!validateBeforeSend()) return;

    // Prepare payload: send raw Age and Stress (let backend convert)
    // Convert Yes/No to simple strings/numbers - backend handles conversion
    const payload = {...form};
    // normalize Yes/No: keep as-is; backend will map; but convert numbers strings to numbers
    payload.Age = Number(payload.Age);
    // stress keep as string or number; backend handles both
    try {
      const res = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Prediction failed");
        return;
      }
      setResult(data);
    } catch (e) {
      setError("Cannot reach backend");
    }
  };

  return (
    <div className="panel">
      <h1>Hair Loss Prediction</h1>

      <label>Age (10-100)</label>
      <input name="Age" type="number" min="10" max="100" value={form.Age} onChange={handle} />

      <label>Stress (1-10) OR Low/Medium/High</label>
      <input name="Stress" value={form.Stress} onChange={handle} placeholder="e.g. 5 or Medium" />

      {[
        "Genetics","Hormonal_Changes","Medical_Conditions","Medications_and_Treatments",
        "Nutritional_Deficiencies","Poor_Hair_Care_Habits","Environmental_Factors","Smoking","Weight_Loss"
      ].map(k => (
        <div key={k}>
          <label>{k.replace(/_/g," ")}</label>
          <select name={k} value={form[k]} onChange={handle}>
            <option value="">-- choose --</option>
            <option value="1">Yes</option>
            <option value="0">No</option>
          </select>
        </div>
      ))}

      <button onClick={submit}>Predict</button>

      {error && <div className="err">{error}</div>}
      {result && (
        <div className="res">
          <p><b>Prediction:</b> {result.prediction === 1 ? "High risk" : "Low risk"}</p>
          <p><b>Probability:</b> {(result.probability*100).toFixed(2)}%</p>
        </div>
      )}
    </div>
  );
}

export default App;
