import React, { useState, useEffect, useRef } from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-c_cpp';
import 'ace-builds/src-noconflict/theme-twilight';
import axios from 'axios';
import './App.css';

const CodeEditor = () => {
  const [studentCode, setStudentCode] = useState('');
  const [headers, setHeaders] = useState('');
  const [output, setOutput] = useState([]);
  const [mainFunction, setMainFunction] = useState('');
  const [loading, setLoading] = useState(false);
  const [mainReturnType, setMainreturnType] = useState('');
  const [funcDeclaration, setFuncDeclaration] = useState('');
  const [notifications, setNotifications] = useState([]);

  const headerEditorRef = useRef(null);
  const studentCodeEditorRef = useRef(null);
  const mainFunctionEditorRef = useRef(null);

  const validateInputs = () => {
    const newNotifications = [];
    if (!headers) newNotifications.push('Please include the header files.');
    if (!funcDeclaration) newNotifications.push('Please provide the function declaration.');
    if (!studentCode) newNotifications.push('Please write the function implementation.');
    if (!mainReturnType) newNotifications.push('Please specify the return type of the main function.');
    if (!mainFunction) newNotifications.push('Please provide the code for the main function.');
    const funcName = funcDeclaration.split('(')[0].trim().split(' ').pop(); // Get the function name
    if (mainFunction && !mainFunction.includes(funcName)) newNotifications.push(`The function '${funcName}' is not called in the main function.`);
    setNotifications(newNotifications);
  };

  const handleSubmit = async () => {
    validateInputs();
    setLoading(true);
    try {
      const response = await axios.post(
        'http://localhost:5000/submit',
        { studentCode, mainFunction, mainReturnType, funcDeclaration },
        {
          headers: {
            'Custom-Headers': headers
          }
        }
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

  const updateEditorHeight = (editorRef, content) => {
    if (editorRef.current) {
      const editor = editorRef.current.editor;
      const lines = content.split('\n').length;
      const newHeight = lines * 16 + 20; // 16px per line + some padding
      editor.container.style.height = `${newHeight}px`;
      editor.resize();
    }
  };

  useEffect(() => {
    updateEditorHeight(headerEditorRef, headers);
  }, [headers]);

  useEffect(() => {
    updateEditorHeight(studentCodeEditorRef, studentCode);
  }, [studentCode]);

  useEffect(() => {
    updateEditorHeight(mainFunctionEditorRef, mainFunction);
  }, [mainFunction]);

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
        {notifications.length > 0 && (
          <div style={{ color: 'red', marginBottom: '10px' }}>
            {notifications.map((notification, index) => (
              <div key={index}>{notification}</div>
            ))}
          </div>
        )}
        <div style={{padding:"10px 10px 10px 10px", backgroundColor:"#141414", color:"white", fontWeight:"600"}}>
          <div className='header-div' style={{ marginBottom: "10px" }}>
            <pre>Include header files</pre>
            <AceEditor
              ref={headerEditorRef}
              mode="c_cpp"
              theme="twilight"
              value={headers}
              onChange={newValue => setHeaders(newValue)}
              name="header_editor"
              editorProps={{ $blockScrolling: true }}
              width="99%"
              fontSize={15}
            />
          </div>
          <div>
            <p>
              <input
                type="text"
                value={funcDeclaration}
                onChange={e => setFuncDeclaration(e.target.value)}
                style={{ padding: '5px', fontSize: '15px',margin:"5px" }}
                placeholder='function declaration'
              />
              &#123;
            </p>
            <AceEditor
              ref={studentCodeEditorRef}
              mode="c_cpp"
              theme="twilight"
              value={studentCode}
              onChange={newValue => setStudentCode(newValue)}
              name="student_code_editor"
              editorProps={{ $blockScrolling: true }}
              width="100%"
              style={{ minHeight: '250px' }}
              fontSize={15}
            />
            <p>&#125;</p>
          </div>
          <div className='main-function-div' style={{ marginBottom: "10px" }}>
            <p>
            <input
              type="text"
              value={mainReturnType}
              onChange={e => setMainreturnType(e.target.value)}
              style={{ padding: '5px', fontSize: '15px',margin:"5px" }}
              placeholder='return type of main function'
            />
              main &#123;
            </p>
            <AceEditor
              ref={mainFunctionEditorRef}
              mode="c_cpp"
              theme="twilight"
              value={mainFunction}
              onChange={newValue => setMainFunction(newValue)}
              name="main_function_editor"
              editorProps={{ $blockScrolling: true }}
              width="100%"
              fontSize={15}
              style={{ minHeight: '250px' }}
            />
            <p>&#125;</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
