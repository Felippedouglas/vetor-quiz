import { useState } from "react";
import Quiz from "../quiz";
import './style.css'

export default function Home() {

    const [quiz, setQuiz] = useState(false);
    const [resultado, setResultado] = useState({ corretas: 0, erradas: 0 });

    return (
        <>
            {!quiz && quiz !== 'recomecar' &&
                <div className="div-tentar-novamente">
                    <p>Bem vindo ao <strong>Vetor Quiz!</strong></p>
                    <button
                        className="bt-comecar-quiz"
                        onClick={() => setQuiz(true)}
                    >
                        Começar
                    </button>
                </div>
            }

            {quiz === true &&
                <Quiz setQuiz={(data) => {
                    if (typeof data === "object" && data.status === "parabens") {
                        setResultado({ corretas: data.corretas, erradas: data.erradas });
                        setQuiz("parabens");
                    } else {
                        setQuiz(data);
                    }
                }} />
            }

            {quiz === "parabens" &&
                <div className="div-tentar-novamente">
                    <p><strong>Fim!</strong></p>

                    <p>
                        ✔️ Acertos: <strong>{resultado.corretas}</strong>
                    </p>
                    <p>
                        ❌ Erros: <strong>{resultado.erradas}</strong>
                    </p>

                    <button
                        className="bt-comecar-quiz"
                        onClick={() => setQuiz(true)}
                    >
                        Jogar Novamente
                    </button>
                </div>
            }
        </>
    );
}
