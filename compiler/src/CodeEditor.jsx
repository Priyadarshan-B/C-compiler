import React, { useState, useEffect, useRef } from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-c_cpp';
import 'ace-builds/src-noconflict/theme-twilight';
import axios from 'axios';
import './App.css';

const CodeEditor = () => {
  const [functionName, setFunctionName] = useState('');
  const [args, setArgs] = useState('');
  const [argTypes, setArgTypes] = useState('');
  const [mainFunction, setMainFunction] = useState('');
  const [code, setCode] = useState('');
  const [output, setOutput] = useState([]);
  const [loading, setLoading] = useState(false);

  const codeEditorRef = useRef(null);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/submit', {
        functionName,
        args,
        argTypes,
        mainFunction,
        code,
      });
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
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', padding: '10px', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: '10px' }}>
        <label>Function Name: </label>
        <input type="text" value={functionName} onChange={(e) => setFunctionName(e.target.value)} />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>Number of Arguments: </label>
        <input type="text" value={args} onChange={(e) => setArgs(e.target.value)} placeholder="e.g., a, b" />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>Argument Types: </label>
        <input type="text" value={argTypes} onChange={(e) => setArgTypes(e.target.value)} placeholder="e.g., int, int" />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>Main Function: </label>
        <textarea value={mainFunction} onChange={(e) => setMainFunction(e.target.value)} rows="4" cols="50"></textarea>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </div>
      <div style={{ marginTop: '20px' }}>
        <AceEditor
          ref={codeEditorRef}
          mode="c_cpp"
          theme="twilight"
          value={code}
          onChange={(newValue) => setCode(newValue)}
          name="code_editor"
          editorProps={{ $blockScrolling: true }}
          width="100%"
          fontSize={15}
          style={{ minHeight: '85vh' }}
        />
      </div>
      <div style={{ marginTop: '20px' }}>
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
    </div>
  );
};

export default CodeEditor;
