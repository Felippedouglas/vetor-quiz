// AdminProtected.js
import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import CryptoJS from "crypto-js";
import { auth, db } from "../../firebase";
import "./admin.css";
import { MathJax, MathJaxContext } from "better-react-mathjax";

// Componente de login
function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  const login = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, senha);
      setUser(userCredential.user);
    } catch (err) {
      setErro("E-mail ou senha inválidos");
    }
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <h2>Login</h2>
        <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
        />
        <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
        />
        <button onClick={login}>Entrar</button>
        {erro && <p className="error">{erro}</p>}
      </div>
    </div>
  );
}

// Componente Admin
function Admin() {
  const [lista, setLista] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [alternativas, setAlternativas] = useState(["", "", "", ""]);
  const [resposta, setResposta] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [adicionando, setAdicionando] = useState(false); // para controlar formulário de nova pergunta
  const perguntasDocRef = doc(db, "perguntas", "todas");

  // Buscar perguntas do Firestore
  useEffect(() => {
    const fetchPerguntas = async () => {
      try {
        const snap = await getDoc(perguntasDocRef);
        if (snap.exists()) {
          setLista(snap.data().perguntas);
        }
      } catch (err) {
        console.error("Erro ao buscar perguntas:", err);
      }
    };
    fetchPerguntas();
  }, []);

  // Atualizar Firestore
  const atualizarFirestore = async (novaLista) => {
    try {
      await setDoc(perguntasDocRef, { perguntas: novaLista });
    } catch (err) {
      console.error("Erro ao atualizar Firestore:", err);
    }
  };

  function atualizarAlternativa(index, valor) {
    const nova = [...alternativas];
    nova[index] = valor;
    setAlternativas(nova);
  }

  function criptografarID(id) {
    return CryptoJS.AES.encrypt(id.toString(), id.toString()).toString();
  }

  function iniciarEdicao(index) {
    const p = lista[index];
    setTitulo(p.titulo);
    setAlternativas(p.alternativas.map(a => a.alternativa));

    let idCorreta = "";
    for (let alt of p.alternativas) {
      try {
        const tentativa = CryptoJS.AES.decrypt(p.resposta, alt.id.toString()).toString(CryptoJS.enc.Utf8);
        if (tentativa === alt.id.toString()) {
          idCorreta = alt.id.toString();
          break;
        }
      } catch {}
    }
    setResposta(idCorreta);
    setEditIndex(index);
    setAdicionando(false);
  }

  function adicionarPergunta() {
    setTitulo("");
    setAlternativas(["", "", "", ""]);
    setResposta("");
    setEditIndex(null);
    setAdicionando(true);
  }

  function voltar() {
    setTitulo("");
    setAlternativas(["", "", "", ""]);
    setResposta("");
    setEditIndex(null);
    setAdicionando(false);
  }

  function salvar() {
    // validação obrigatória
    if (!titulo.trim() || alternativas.some(a => !a.trim()) || !resposta) {
      return alert("Preencha o título, todas as alternativas e selecione a correta.");
    }

    const alts = alternativas.map((alt, i) => ({ alternativa: alt, id: i + 1 }));
    const alternativaCorreta = alts.find(a => a.id.toString() === resposta);
    const cript = criptografarID(alternativaCorreta.id);

    const obj = { titulo, alternativas: alts, resposta: cript };
    const novaLista = editIndex !== null
      ? lista.map((p, i) => (i === editIndex ? obj : p))
      : [...lista, obj];

    setLista(novaLista);
    atualizarFirestore(novaLista);
    voltar();
  }

  function remover(index) {
    if (!window.confirm("Tem certeza que deseja excluir esta pergunta?")) return;
    const nova = lista.filter((_, i) => i !== index);
    setLista(nova);
    atualizarFirestore(nova);
  }

  const config = {
    loader: { load: ["input/asciimath", "output/chtml", "ui/menu"] },
    tex: {
      inlineMath: [["$", "$"], ["\\(", "\\)"]],
      displayMath: [["$$", "$$"], ["\\[", "\\]"]],
    }
  };

  return (
    <MathJaxContext config={config}>
      <div className="admin-perguntas-container">
        <h2 className="admin-perguntas-titulo">
          {(editIndex !== null || adicionando) ? (
            <button className="admin-perguntas-btn-voltar" onClick={voltar}>Voltar</button>
          ) : <button className="admin-perguntas-btn-voltar" onClick={()=>window.location.href = "/"}>Voltar</button>}
          <span>Gerenciar Perguntas</span>
          <div></div>
        </h2>

        {editIndex !== null || adicionando ? (
          <div className="admin-perguntas-form-container">
            <textarea
              className="admin-perguntas-input"
              placeholder="Título da pergunta (Suporta LaTeX: $...$)"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />

            {/* Preview dinâmico do Título */}
            <div className="preview-latex">
              <strong>Preview do Título:</strong>
              {/* Adicione a prop display aqui */}
              <MathJax dynamic display>{titulo || "..."}</MathJax>
            </div>

            <div className="admin-perguntas-alts">
              {alternativas.map((a, i) => (
                <div key={i} style={{ marginBottom: "10px" }}>
                  <input 
                    className="admin-perguntas-input alt-input" 
                    placeholder={`Alternativa ${i + 1}`} 
                    value={a} 
                    onChange={(e) => atualizarAlternativa(i, e.target.value)} 
                  />
                  <div style={{ fontSize: "0.9em", color: "#ccc", marginTop: "5px" }}>
                    <MathJax dynamic display>{a || "..."}</MathJax>
                  </div>
                </div>
              ))}
            </div>

            <div className="admin-perguntas-select-resposta">
              <p>Determine qual será a alternativa correta:</p>
              {alternativas.map((a, i) => {
                const letra = String.fromCharCode(65 + i);
                const selecionada = resposta == i + 1;
                return (
                  <label key={i} className={`admin-perguntas-label-resp ${selecionada ? "resp-selecionada" : ""}`}>
                    <input type="radio" name="correta" value={i + 1} checked={selecionada} onChange={(e) => setResposta(e.target.value)} />
                    <span className="resp-letra">{letra})</span>
                    <MathJax inline dynamic>{a || `Alternativa ${letra}`}</MathJax>
                  </label>
                );
              })}
            </div>
            <button className="admin-perguntas-btn" onClick={salvar}>{adicionando ? "Adicionar Pergunta" : "Salvar Edição"}</button>
          </div>
        ) : (
          <div>
            <button className="admin-perguntas-btn" onClick={adicionarPergunta}>Adicionar Nova Pergunta</button>
            <div className="admin-perguntas-lista">
              {lista.map((p, i) => (
                <div key={i} className="admin-perguntas-item">
                  <div>
                    <b>{i + 1}. </b>
                    <MathJax dynamic display>{p.titulo}</MathJax>
                  </div>
                  <div>
                      <button className="admin-perguntas-btn-edit" onClick={() => iniciarEdicao(i)}>Editar</button>
                      <button className="admin-perguntas-btn-del" onClick={() => remover(i)}>Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MathJaxContext>
  );
}

// Componente final protegido por login
export default function AdminProtected() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <p>Carregando...</p>;
  if (!user) return <Login setUser={setUser} />;

  return (
    <div>
      <Admin />
    </div>
  );
}
