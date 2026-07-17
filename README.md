# Operacional_LogRev — Dashboard GitHub Pages

Dashboard executivo em HTML, CSS e JavaScript puro. Não utiliza bibliotecas externas.

## Estrutura

- `index.html`: página principal;
- `css/style.css`: identidade visual e responsividade para TV;
- `js/app.js`: leitura dos CSVs, KPIs, gráficos, alternância e refresh;
- `data/baixados.csv`;
- `data/internalizados.csv`;
- `data/estoque.csv`.

## Publicação inicial no GitHub

1. Crie ou abra o repositório.
2. Envie todos os arquivos e pastas, mantendo a estrutura.
3. Substitua os três arquivos-modelo da pasta `data/` pelos CSVs reais gerados pelo Excel.
4. No repositório, acesse **Settings > Pages**.
5. Em **Build and deployment**, selecione **Deploy from a branch**.
6. Escolha a branch principal e a pasta raiz `/ (root)`.
7. Aguarde a URL do GitHub Pages ser publicada.

## Regras já implementadas

- refresh completo da página a cada 2 horas;
- leitura sem cache dos CSVs;
- visão executiva 16:9 e responsiva;
- alternância automática a cada 30 segundos;
- Baixados: volume por agente e tipo de desconexão;
- Estoque: visões separadas para terceiras e lojas;
- Internalizados: volume por origem e tipo de desconexão;
- Tecnologia: internalizados no mês por tecnologia;
- faixa inferior dinâmica com os maiores volumes;
- nenhuma exposição de serial ou dado individual.

## Importante

A faixa inferior mostra destaques de volume. O desempenho contra meta ainda não foi incluído porque a regra de metas será definida em etapa posterior.

## Teste local

Por segurança do navegador, não abra apenas o `index.html` com duplo clique. Use um servidor local, por exemplo:

```bash
python -m http.server 8000
```

Depois abra `http://localhost:8000`.
