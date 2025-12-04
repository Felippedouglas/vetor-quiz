import { useState, useEffect } from "react";
import Quiz from "../quiz";
import { addDoc, collection, query, orderBy, onSnapshot } from "firebase/firestore";
import './style.css';
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
    const [respostasDetalhadas, setRespostasDetalhadas] = useState([]);

    // Monitorar usuário logado
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    // Início do cronômetro geral
    useEffect(() => {
        if (quiz === true) setInicio(Date.now());
    }, [quiz]);

    // Atualizando cronômetro geral
    useEffect(() => {
        if (quiz !== true) return;

        const interval = setInterval(() => {
            if (inicio) setCronometro(Math.floor((Date.now() - inicio) / 1000));
        }, 1000);

        return () => clearInterval(interval);
    }, [quiz, inicio]);

    // Registrar cada resposta do quiz
    function registrarResposta(pergunta, respostaSelecionada, correta, inicioPergunta, fimPergunta) {
        const tempoPergunta = Math.floor((fimPergunta - inicioPergunta) / 1000);
        setRespostasDetalhadas(prev => [
            ...prev,
            {
                perguntaId: pergunta.id,
                titulo: pergunta.titulo,
                respostaSelecionada,
                correta,
                inicio: inicioPergunta,
                fim: fimPergunta,
                tempo: tempoPergunta,
                usuarioId: user?.uid || null
            }
        ]);
    }

    // Salvar ranking detalhado
    async function salvarRanking() {
        if (!nome.trim()) return alert("Digite seu nome!");

        const fimQuiz = Date.now();
        const tempoTotal = Math.floor((fimQuiz - inicio) / 1000);
        const acertos = resultado.corretas;
        const erradas = resultado.erradas;

        await addDoc(collection(db, "ranking"), {
            nome,
            usuarioId: user?.uid || null,
            corretas: acertos,
            erradas,
            tempo: tempoTotal,
            respostas: respostasDetalhadas,
            totalPerguntas: respostasDetalhadas.length,
            porcentagemAcertos: ((acertos / respostasDetalhadas.length) * 100).toFixed(2),
            criadoEm: Date.now()
        });

        setQuiz("ranking");
        setRespostasDetalhadas([]); // resetar respostas detalhadas
    }

    // Carregar ranking
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

    return (
        <div className="home-container">
            {/* Tela inicial */}
            {!quiz && (
                <div className="home-content">
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

                    <div className="home-side">
                        <h3>🏆 Ranking</h3>
                        {ranking.length === 0 ? (
                            <h4>Ainda não há um ranking</h4>
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
                <Quiz
                    formatarTempo={formatarTempo}
                    cronometro={cronometro}
                    registrarResposta={registrarResposta} // enviar função para o Quiz
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
                            addDoc(collection(db, "ranking"), {
                                nome,
                                usuarioId: user?.uid || null,
                                corretas: result.corretas,
                                erradas: result.erradas,
                                tempo: result.tempo,
                                respostas: respostasDetalhadas,
                                totalPerguntas: respostasDetalhadas.length,
                                porcentagemAcertos: ((result.corretas / respostasDetalhadas.length) * 100).toFixed(2),
                                criadoEm: Date.now()
                            }).then(() => setQuiz("ranking"));
                        }
                    }}
                />
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
                <div className="container-tentar-novamente">
                    <div className="content-tentar-novamente">
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
                </div>
            )}

            <button
                className="btn-admin-flutuante"
                onClick={() => window.location.href = "/admin"}
            >
                ⚙️ ADMIN
            </button>
        </div>
    );
}
