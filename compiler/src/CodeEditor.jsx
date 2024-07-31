import React, { useState, useEffect, useRef } from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-c_cpp';
import 'ace-builds/src-noconflict/theme-twilight';
import axios from 'axios';
import './App.css';

const CodeEditor = () => {
  const [code, setCode] = useState(``);
  const [output, setOutput] = useState([]);
  const [loading, setLoading] = useState(false);

  const codeEditorRef = useRef(null);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        'http://localhost:5000/submit',
        { code },
      );
      setOutput(response.data);
      console.log(response);
    } catch (error) {
      console.error('Submission error:', error);
      setOutput([{ testCase: 'Error', error: 'Failed to submit or evaluate code.' }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (codeEditorRef.current) {
      const editor = codeEditorRef.current.editor;
      const lines = code.split('\n').length;
      const newHeight = lines * 16 + 20; // 16px per line + some padding
      editor.container.style.height = `${newHeight}px`;
      editor.resize();
    }
  }, [code]);

  return (
    <div style={{ display: "flex", width: "100%", justifyContent: "space-between", height: "fit-content", backgroundColor: "rgb(220, 222, 224)", padding: "10px", boxSizing: "border-box" }}>
      <div style={{ width: "48%" }}>
        <h2>Question</h2>
        <p>
          <b>
            Add 2 numbers
          </b>
        </p>
        <h2>Sample Inputs and Outputs</h2>
        <p>Input: 10 20<br />Output: 30</p>
        <p>Input: -10 20<br />Output: 10</p>

        <table>
          <thead>
            <tr>
              <th>Test Case</th>
              <th>Result</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {output.map((result, index) => (
              <tr key={index}>
                <td>{`${result.testCase}`}</td>
                <td>{result.result}</td>
                <td>{result.passed ? 'Passed' : 'Failed'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ width: "50%", boxShadow: "rgba(0, 0, 0, 0.24) 0px 3px 8px", padding: "10px", boxSizing: "border-box", height: "fit-content", backgroundColor: "white" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
        <div style={{ padding: "10px 10px 10px 10px", backgroundColor: "#141414", color: "white", fontWeight: "600" }}>
          <AceEditor
            ref={codeEditorRef}
            mode="c_cpp"
            theme="twilight"
            value={code}
            onChange={newValue => setCode(newValue)}
            name="code_editor"
            editorProps={{ $blockScrolling: true }}
            width="100%"
            fontSize={15}
            style={{ minHeight: '85vh' }}
          />
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
