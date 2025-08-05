import { useEffect, useRef, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, Code } from "lucide-react";
import type { CodeState } from "@shared/schema";

interface CodeEditorProps {
  initialCode: CodeState;
  roomId: string;
  participantId?: string;
  socket: WebSocket | null;
}

export default function CodeEditor({ initialCode, roomId, participantId, socket }: CodeEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [code, setCode] = useState(initialCode?.content || "");
  const [language, setLanguage] = useState(initialCode?.language || "javascript");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [version, setVersion] = useState(initialCode?.version || 0);
  const [activeUsers] = useState([
    { id: "1", name: "S", color: "blue" },
    { id: "2", name: "A", color: "green" },
  ]);

  useEffect(() => {
    if (socket) {
      const handleMessage = (event: MessageEvent) => {
        const message = JSON.parse(event.data);
        
        if (message.type === 'code-update') {
          setCode(message.codeState.content);
          setLanguage(message.codeState.language);
          setVersion(message.codeState.version);
        }
      };

      socket.addEventListener('message', handleMessage);
      return () => socket.removeEventListener('message', handleMessage);
    }
  }, [socket]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    
    if (socket && participantId) {
      socket.send(JSON.stringify({
        type: 'code-change',
        content: newCode,
        language,
        version,
        participantId,
      }));
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    
    if (socket && participantId) {
      socket.send(JSON.stringify({
        type: 'code-change',
        content: code,
        language: newLanguage,
        version,
        participantId,
      }));
    }
  };

  const runCode = async () => {
    setIsRunning(true);
    setOutput("$ Running code...\n");
    
    // Simulate code execution
    setTimeout(() => {
      if (language === "javascript") {
        try {
          // Simple evaluation for demo - in production, use a sandboxed environment
          const result = eval(code);
          setOutput(`$ node interview.js\n${result}\nProcess finished with exit code 0`);
        } catch (error: any) {
          setOutput(`$ node interview.js\nError: ${error.message}\nProcess finished with exit code 1`);
        }
      } else {
        setOutput(`$ ${language} interview.${getFileExtension(language)}\nCode execution for ${language} not implemented in demo\nProcess finished with exit code 0`);
      }
      setIsRunning(false);
    }, 1500);
  };

  const resetCode = () => {
    const defaultCode = "// Welcome to the collaborative coding interview!\n// Both interviewer and candidate can edit this code in real-time\n\nfunction fibonacci(n) {\n    if (n <= 1) {\n        return n;\n    }\n    return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\n// TODO: Optimize this function\n// Hint: Consider using dynamic programming\n\nconsole.log(fibonacci(10));\n\n// Feel free to ask questions and discuss your approach!";
    handleCodeChange(defaultCode);
  };

  const getFileExtension = (lang: string) => {
    const extensions: Record<string, string> = {
      javascript: "js",
      python: "py",
      java: "java",
      cpp: "cpp",
      html: "html",
      css: "css",
    };
    return extensions[lang] || "txt";
  };

  const getLineNumbers = () => {
    const lineCount = code.split('\n').length;
    return Array.from({ length: Math.max(lineCount, 15) }, (_, i) => i + 1);
  };

  return (
    <div className="flex-1 bg-slate-900 flex flex-col">
      {/* Editor Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Code className="text-blue-400 w-4 h-4" />
            <span className="text-slate-300 font-medium">Collaborative Editor</span>
          </div>
          
          {/* Language Selector */}
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-slate-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="java">Java</SelectItem>
              <SelectItem value="cpp">C++</SelectItem>
              <SelectItem value="html">HTML</SelectItem>
              <SelectItem value="css">CSS</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-3">
          {/* Active Users */}
          <div className="flex items-center space-x-2">
            <div className="flex -space-x-1">
              {activeUsers.map((user) => (
                <div
                  key={user.id}
                  className={`w-6 h-6 bg-${user.color}-600 rounded-full border-2 border-slate-800 flex items-center justify-center`}
                >
                  <span className="text-white text-xs font-medium">{user.name}</span>
                </div>
              ))}
            </div>
            <span className="text-slate-400 text-sm">{activeUsers.length} editing</span>
          </div>

          {/* Editor Actions */}
          <Button
            onClick={runCode}
            disabled={isRunning}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            <Play className="w-3 h-3 mr-1" />
            {isRunning ? "Running..." : "Run"}
          </Button>
          <Button
            onClick={resetCode}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {/* Code Editor Area */}
      <div className="flex-1 relative">
        {/* Line Numbers */}
        <div className="absolute left-0 top-0 w-12 h-full bg-slate-800 border-r border-slate-700 py-4 z-10">
          <div className="font-mono text-xs text-slate-500 text-right pr-2 space-y-0">
            {getLineNumbers().map((num) => (
              <div key={num} className="leading-6 h-6">
                {num}
              </div>
            ))}
          </div>
        </div>

        {/* Editor Content */}
        <div className="ml-12 h-full">
          <textarea
            ref={editorRef}
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            className="w-full h-full bg-slate-900 text-slate-100 font-mono text-sm p-4 border-none outline-none resize-none leading-6"
            placeholder="Start coding here... This editor supports real-time collaboration!"
            spellCheck={false}
          />
        </div>

        {/* Collaborative Cursors (mockup) */}
        <div className="absolute top-20 left-32 w-0.5 h-6 bg-blue-400 animate-pulse pointer-events-none"></div>
        <div className="absolute top-14 left-32 bg-blue-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none">
          Sarah is typing...
        </div>
      </div>

      {/* Code Output Panel */}
      <div className="h-32 bg-slate-800 border-t border-slate-700">
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700">
          <span className="text-slate-300 font-medium">Output</span>
          <Button
            onClick={() => setOutput("")}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white h-auto p-1"
          >
            ×
          </Button>
        </div>
        <div className="p-4 font-mono text-sm text-slate-300 overflow-auto h-20">
          {output.split('\n').map((line, index) => (
            <div key={index} className={line.startsWith('$') ? 'text-green-400' : line.includes('Error') ? 'text-red-400' : line.includes('Process finished') ? 'text-slate-500' : ''}>
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}