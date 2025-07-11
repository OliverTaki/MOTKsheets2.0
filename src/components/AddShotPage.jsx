import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { SheetsDataContext } from '../contexts/SheetsDataContext';
import { appendRow } from '../api/appendRow';

const AddShotPage = () => {
  // --- context ----------------------------------------------------
  const { token, sheetId, setNeedsReAuth } = useContext(AuthContext);
  const {    fields,    idToColIndex,    loading: sheetsLoading,    error: sheetsError,  } = useContext(SheetsDataContext);
  const navigate = useNavigate();

  // --- local state -----------------------------------------------
  const [formData, setFormData] = useState({});
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- submit -----------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (token || sheetId) {
      setNeedsReAuth(true);
      return;
    }
    try {
      await appendRow(sheetId, token, formData, idToColIndex);
      navigate('/');
    } catch (err) {
      console.error(err);
      if (err?.status === 401) setNeedsReAuth(true);
    }
  };

  // --- UI ---------------------------------------------------------
  if (sheetsLoading) return <div>Loading…</div>;
  if (sheetsError) return <div>Sheets error: {sheetsError.message}</div>;

  return (
    <form onSubmit={handleSubmit}>
      {fields.map((f) => (
        <div key={f.id}>
          <label>{f.label}</label>
          <input name={f.id} onChange={handleChange} />
        </div>
      ))}
      <button type="submit">Add Shot</button>
    </form>
  );
};

export default AddShotPage;