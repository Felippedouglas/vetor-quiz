import { useEffect, useState } from "react";
import { Perguntas } from "../../componentes/perguntas";
import CryptoJS from "crypto-js";
import './style.css';

import gif1 from "../../componentes/gifs/1.gif";
import gif2 from "../../componentes/gifs/2.gif";
import gif3 from "../../componentes/gifs/3.gif";
import gif4 from "../../componentes/gifs/4.gif";
import gif5 from "../../componentes/gifs/5.gif";
import gif6 from "../../componentes/gifs/6.gif";
import gif7 from "../../componentes/gifs/7.gif";
import gif8 from "../../componentes/gifs/8.gif";
import gif9 from "../../componentes/gifs/9.gif";
import gif from "../../componentes/gifs/1.mp4";
import defeat from "../../componentes/gifs/defeat.mp4";
import congrats from "../../componentes/gifs/congrats.mp4";

export default function Quiz({ setQuiz }) {

    const [numeroPergunta, setNumeroPergunta] = useState(0);
    const [PerguntasAleatorias, setPerguntasAleatorias] = useState([]);
    const [alternativasAtuais, setAlternativasAtuais] = useState([]);
    const [locked, setLocked] = useState(false);
    const [verificado, setVerificado] = useState(false);
    const [statusRespostas, setStatusRespostas] = useState([]);
    const [midiaAtual, setMidiaAtual] = useState(null);
    const [mensagemFeedback, setMensagemFeedback] = useState("");
    const [corFeedback, setCorFeedback] = useState("");

    const todasMidias = [gif1, gif2, gif3, gif4, gif5, gif6, gif7, gif8, gif9, gif];
    const [midiasRestantes, setMidiasRestantes] = useState([]);

    function shuffleArray(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    useEffect(() => {
        const copia = shuffleArray([...Perguntas]);
        setPerguntasAleatorias(copia);
        setStatusRespostas(new Array(copia.length).fill("neutra"));
        setMidiasRestantes(shuffleArray([...todasMidias]));
    }, []);

    useEffect(() => {
        if (!PerguntasAleatorias.length) return;

        const pergunta = PerguntasAleatorias[numeroPergunta];
        setAlternativasAtuais(shuffleArray([...pergunta.alternativas]));
        setVerificado(false);
        setMensagemFeedback("");
        setCorFeedback("");

        const checked = document.querySelector('input[name="alternativa"]:checked');
        if (checked) checked.checked = false;

        setLocked(false);

        let restante = [...midiasRestantes];
        if (restante.length === 0) restante = shuffleArray([...todasMidias]);

        const midiaEscolhida = restante.shift();
        setMidiaAtual(midiaEscolhida);
        setMidiasRestantes(restante);

    }, [numeroPergunta, PerguntasAleatorias]);

    function encontrarIdCorreto(respostaCriptografada, alternativas) {
        for (let alt of alternativas) {
            const key = String(alt.id);
            try {
                const bytes = CryptoJS.AES.decrypt(respostaCriptografada, key);
                const txt = bytes.toString(CryptoJS.enc.Utf8);
                if (txt === key) return key;
            } catch (e) { }
        }
        return null;
    }

    function resetLabels(alternativas) {
        alternativas.forEach(a => {
            const lbl = document.getElementById(`label-alternativa-${a.id}`);
            if (lbl) lbl.style.background = '#404040';
        });
    }

    function VerificarResposta(respostaCriptografada) {
        if (locked || verificado) return;

        setLocked(true);

        const alternativaEscolhida =
            document.querySelector('input[name="alternativa"]:checked')?.value;

        if (!alternativaEscolhida) {
            setLocked(false);
            return;
        }

        const idCorreto = encontrarIdCorreto(
            respostaCriptografada,
            alternativasAtuais
        ) || encontrarIdCorreto(
            respostaCriptografada,
            PerguntasAleatorias[numeroPergunta].alternativas
        );

        const labelEscolhida = document.getElementById(`label-alternativa-${alternativaEscolhida}`);
        const labelCorreta = idCorreto ? document.getElementById(`label-alternativa-${idCorreto}`) : null;

        let statusAtual = [...statusRespostas];
        let acertou = false;

        if (!idCorreto || alternativaEscolhida !== idCorreto) {
            statusAtual[numeroPergunta] = "errada";
            setMensagemFeedback("Resposta incorreta!");
            setCorFeedback("#FF4500");
            if (labelEscolhida) labelEscolhida.style.background = "#FF4500";
        } else {
            statusAtual[numeroPergunta] = "correta";
            acertou = true;
            setMensagemFeedback("Resposta correta!");
            setCorFeedback("#32CD32");
            if (labelCorreta) labelCorreta.style.background = "#32CD32";
        }

        setMidiaAtual(acertou ? congrats : defeat);
        setStatusRespostas(statusAtual);
        setVerificado(true);
        setLocked(false);
    }

    function avancar() {
        resetLabels(alternativasAtuais);

        const proxima = numeroPergunta + 1;

        if (proxima >= PerguntasAleatorias.length) {

            const corretas = statusRespostas.filter(s => s === "correta").length;
            const erradas = statusRespostas.filter(s => s === "errada").length;

            setQuiz({
                status: "parabens",
                corretas,
                erradas
            });

            return;
        }

        setNumeroPergunta(proxima);
    }

    if (!PerguntasAleatorias.length) {
        return <div className="container-quiz">Carregando...</div>;
    }

    const perguntaAtual = PerguntasAleatorias[numeroPergunta];
    const letras = ['A', 'B', 'C', 'D'];

    return (
        <div className="container-quiz">

            <div className="barra-progresso">
                {statusRespostas.map((status, idx) => (
                    <div
                        key={idx}
                        className="barra-label"
                        style={{
                            background:
                                status === "correta" ? "#32CD32" :
                                    status === "errada" ? "#FF4500" :
                                        "#404040"
                        }}
                    />
                ))}
            </div>

            {midiaAtual && (
                <div className="midia-container">
                    {midiaAtual.endsWith(".gif") ? (
                        <img src={midiaAtual} className="midia-pergunta" />
                    ) : (
                        <video src={midiaAtual} autoPlay muted loop className="midia-pergunta" />
                    )}
                    {mensagemFeedback && (
                        <p style={{ color: corFeedback, fontWeight: 600 }}>
                            {mensagemFeedback}
                        </p>
                    )}
                </div>
            )}

            <p className="p-numero-pergunta">Pergunta {numeroPergunta + 1}</p>
            <h1 className="titulo-pergunta">{perguntaAtual.titulo}</h1>

            <div className="div-alternativas">
                {alternativasAtuais.map((alternativa, i) => (
                    <div key={i} className="alternativa">
                        <input
                            type="radio"
                            name="alternativa"
                            id={`alternativa-${alternativa.id}`}
                            value={alternativa.id}
                            className="input-alternativa"
                            disabled={verificado}
                        />
                        <label id={`label-alternativa-${alternativa.id}`} htmlFor={`alternativa-${alternativa.id}`}>
                            {letras[i]}) {alternativa.alternativa}
                        </label>
                    </div>
                ))}
            </div>

            <div className="botoes-controle">
                <button
                    className="bt-responder"
                    disabled={verificado}
                    onClick={() => VerificarResposta(perguntaAtual.resposta)}
                >
                    Responder
                </button>

                <button
                    className="bt-avancar"
                    disabled={!verificado}
                    onClick={avancar}
                >
                    Próxima
                </button>
            </div>
        </div>
    );
}
