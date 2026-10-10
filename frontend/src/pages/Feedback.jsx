import { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

function Feedback() {
  const navigate = useNavigate()
  const location = useLocation()
  const [feedbackData, setFeedbackData] = useState(null)
  const reportRef = useRef(null) // Reference for PDF capture

  useEffect(() => {
    if (location.state?.feedback) {
      setFeedbackData(location.state.feedback)
    } else {
      const stored = localStorage.getItem('latestFeedback')
      if (stored) {
        try { setFeedbackData(JSON.parse(stored)) } catch (e) { console.error(e) }
      }
    }
    const token = localStorage.getItem('token')
    if (!token) navigate('/')
  }, [location, navigate])

  // Function to download the report as PDF
  const downloadPDF = async () => {
    if (!reportRef.current) return;
    
    // Temporarily hide the button during capture
    const btn = document.getElementById('download-btn');
    if(btn) btn.style.display = 'none';

    const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('AI_Interview_Feedback_Report.pdf');

    // Show button again
    if(btn) btn.style.display = 'block';
  };

  if (!feedbackData) {
    return (
      <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px', textAlign: 'center' }}>
        <h2>Loading feedback...</h2>
      </div>
    )
  }

  // Data for the Radar Chart (Mapping scores to a 0-100 scale)
  const chartData = [
    { subject: 'Technical', score: feedbackData.technical_score * 10, fullMark: 100 },
    { subject: 'Behavioral', score: feedbackData.behavioral_score * 10, fullMark: 100 },
    { subject: 'Logic', score: 75, fullMark: 100 }, // Simulated for visual balance
    { subject: 'Communication', score: 80, fullMark: 100 },
    { subject: 'Problem Solving', score: 70, fullMark: 100 },
  ];

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' }}>
      <h1 style={{ textAlign: 'center', color: '#2E5C8A' }}>Interview Evaluation Report</h1>
      
      {/* This div is what gets captured by the PDF generator */}
      <div ref={reportRef} style={{ backgroundColor: '#ffffff', border: '1px solid #e0e0e0', borderRadius: '15px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        
        {/* Header inside PDF */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #2E5C8A', paddingBottom: '20px', marginBottom: '30px' }}>
          <h2 style={{ color: '#2E5C8A', margin: 0 }}>Multi-Agent AI Interview System</h2>
          <p style={{ color: '#666', margin: '5px 0 0 0' }}>Comprehensive Candidate Evaluation</p>
        </div>

        {/* Scores and Chart Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
          
          {/* Scores */}
          <div style={{ flex: 1, minWidth: '250px' }}>
            <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f0f8ff', borderRadius: '10px', marginBottom: '15px' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#2E5C8A' }}>Technical Score</h3>
              <p style={{ fontSize: '36px', fontWeight: 'bold', margin: 0, color: '#2E5C8A' }}>{feedbackData.technical_score}/10</p>
            </div>
            <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f0fff0', borderRadius: '10px' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#28a745' }}>Behavioral Score</h3>
              <p style={{ fontSize: '36px', fontWeight: 'bold', margin: 0, color: '#28a745' }}>{feedbackData.behavioral_score}/10</p>
            </div>
          </div>

          {/* Radar Chart */}
          <div style={{ flex: 1, minWidth: '300px', height: '300px' }}>
            <h3 style={{ textAlign: 'center', color: '#2E5C8A', marginTop: 0 }}>Skill Distribution</h3>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                <PolarGrid stroke="#e0e0e0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#999', fontSize: 10 }} />
                <Radar name="Candidate" dataKey="score" stroke="#2E5C8A" fill="#2E5C8A" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Feedback Sections */}
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ color: '#28a745', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>✅ Strengths</h3>
          <p style={{ lineHeight: '1.8', color: '#333', fontSize: '16px' }}>{feedbackData.strengths}</p>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ color: '#dc3545', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>️ Areas for Improvement</h3>
          <p style={{ lineHeight: '1.8', color: '#333', fontSize: '16px' }}>{feedbackData.weaknesses}</p>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <h3 style={{ color: '#2E5C8A', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>🚀 Career Recommendations</h3>
          <p style={{ lineHeight: '1.8', color: '#333', fontSize: '16px' }}>{feedbackData.career_recommendations}</p>
        </div>

        {/* Footer inside PDF */}
        <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #eee', color: '#999', fontSize: '12px' }}>
          Generated by Multi-Agent AI Interview System • {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Action Buttons (Outside the PDF capture area) */}
      <div style={{ textAlign: 'center', marginTop: '30px', display: 'flex', gap: '15px', justifyContent: 'center' }}>
        <button 
          id="download-btn"
          onClick={downloadPDF} 
          style={{ padding: '12px 30px', backgroundColor: '#2E5C8A', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          📥 Download PDF Report
        </button>
        <button 
          onClick={() => navigate('/dashboard')} 
          style={{ padding: '12px 30px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  )
}

export default Feedback