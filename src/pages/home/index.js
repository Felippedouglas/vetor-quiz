import { useState, useEffect } from "react";
import Quiz from "../quiz";
import { addDoc, collection, query, orderBy, onSnapshot} from "firebase/firestore";
import './style.css'
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function Home() {
    const [quiz, setQuiz] = useState(false);
    const [resultado, setResultado] = useState({ corretas: 0, erradas: 0, tempo: 0 });
    const [ranking, setRanking] = useState([]);
    const [nome, setNome] = useState("");
    const [inicio, setInicio] = useState(null);
    const [cronometro, setCronometro] = useState(0);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    // Início do cronômetro
    useEffect(() => {
        if (quiz === true) setInicio(Date.now());
    }, [quiz]);

    // Atualizando o cronômetro
    useEffect(() => {
        if (quiz !== true) return;

        const interval = setInterval(() => {
            if (inicio) {
                setCronometro(Math.floor((Date.now() - inicio) / 1000));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [quiz, inicio]);

    // Salvar no ranking
    async function salvarRanking() {
        if (!nome.trim()) return alert("Digite seu nome!");

        await addDoc(collection(db, "ranking"), {
            nome,
            corretas: resultado.corretas,
            erradas: resultado.erradas,
            tempo: resultado.tempo,
            criadoEm: Date.now()
        });

        setQuiz("ranking");
    }

    // Carrega ranking
    useEffect(() => {
        const q = query(
            collection(db, "ranking"),
            orderBy("corretas", "desc"),
            orderBy("tempo", "asc")
        );

        const unsub = onSnapshot(q, (snap) => {
            const lista = [];
            snap.forEach(doc => lista.push({ id: doc.id, ...doc.data() }));
            setRanking(lista);
        });

        return () => unsub();
    }, []);

    function formatarTempo(segundos) {
        if (segundos < 60) return `${segundos}s`;
        const min = Math.floor(segundos / 60);
        const seg = segundos % 60;
        return `${min}m ${seg}s`;
    }
/*
    useEffect(()=>{
        
async function enviarPerguntasUnicoDocumento() {
  try {
    const perguntasDoc = Perguntas.map(p => ({
      titulo: p.titulo,
      alternativas: p.alternativas.map(a => ({ alternativa: a.alternativa, id: a.id })),
      resposta: p.resposta // já criptografada ou criptografe aqui
    }));

    await setDoc(doc(db, "perguntas", "todas"), { perguntas: perguntasDoc });
    console.log("Todas as perguntas foram enviadas com sucesso!");
  } catch (error) {
    console.error("Erro ao enviar perguntas:", error);
  }
}

enviarPerguntasUnicoDocumento();
    }, [])
*/
    return (
        <div className="home-container">
            {/* TELA INICIAL COM SIDE RANKING */}
            {!quiz && (
                <div className="home-content">
                    
                    {/* Lado esquerdo: nome e botões */}
                    <div className="home-left">
                        <p className="titulo-home">Bem vindo ao <strong>Vetor Quiz!</strong></p>

                        <input
                            placeholder="Digite seu nome"
                            value={nome}
                            onChange={e => setNome(e.target.value)}
                            className="input-nome"
                        />

                        <button
                            className="bt-comecar-quiz"
                            onClick={() => {
                                if (!nome.trim()) return alert("Digite seu nome antes!");
                                setQuiz(true);
                            }}
                        >
                            Começar Quiz
                        </button>
                    </div>

                    {/* Lado direito: ranking ao vivo */}
                    <div className="home-side">
                        <h3>🏆 Ranking</h3>

                        {ranking.length === 0 ? (
                            <p>Ainda não há dados.</p>
                        ) : (
                            ranking.map((r, i) => (
                                <p key={r.id} className="ranking-item">
                                    <span>
                                        <strong>{i + 1}º</strong> {r.nome.length > 15 ? r.nome.slice(0, 10) + "..." : r.nome}
                                    </span>
                                    <span className="acertos-tempo">
                                        {r.corretas} acertos / {formatarTempo(r.tempo)}
                                    </span>
                                </p>
                            ))
                        )}
                    </div>

                </div>
            )}

            {/* Tela do quiz */}
            {quiz === true && (
                <>

                    <Quiz
                        formatarTempo={formatarTempo}
                        cronometro={cronometro}
                        setQuiz={(data) => {
                            if (typeof data === "object" && data.status === "parabens") {
                                const fim = Date.now();
                                const tempo = Math.floor((fim - inicio) / 1000);

                                const result = {
                                    corretas: data.corretas,
                                    erradas: data.erradas,
                                    tempo
                                };

                                setResultado(result);

                                // salva automaticamente
                                addDoc(collection(db, "ranking"), {
                                    nome,
                                    corretas: result.corretas,
                                    erradas: result.erradas,
                                    tempo: result.tempo,
                                    criadoEm: Date.now()
                                }).then(() => {
                                    setQuiz("ranking");
                                });

                            }
                        }}
                    />
                </>
            )}

            {/* Tela de fim */}
            {quiz === "parabens" && (
                <div className="div-tentar-novamente">
                    <p><strong>Fim!</strong></p>

                    <p>✔ Acertos: <strong>{resultado.corretas}</strong></p>
                    <p>❌ Erros: <strong>{resultado.erradas}</strong></p>
                    <p>⏱ Tempo: <strong>{resultado.tempo}s</strong></p>

                    <button className="bt-comecar-quiz" onClick={salvarRanking}>
                        Salvar e ver Ranking
                    </button>

                    <button className="bt-comecar-quiz" onClick={() => setQuiz(true)}>
                        Jogar Novamente
                    </button>
                </div>
            )}

            {/* Ranking separado */}
            {quiz === "ranking" && (
                <div className="div-tentar-novamente">
                    <h2>🏆 Ranking</h2>

                    {ranking.map((r, i) => (
                        <p key={r.id}>
                            <strong>{i + 1}º</strong> - {r.nome.length > 15 ? r.nome.slice(0, 10) + "..." : r.nome} • {r.corretas} acertos • {formatarTempo(r.tempo)}
                        </p>
                    ))}

                    <button className="bt-comecar-quiz" onClick={() => setQuiz(false)}>
                        Voltar ao início
                    </button>
                </div>
            )}

            {user && (
                <button
                    className="btn-admin-flutuante"
                    onClick={() => window.location.href = "/admin"}
                >
                    ⚙️ ADMINISTRADOR
                </button>
            )}
        </div>
    );
}
