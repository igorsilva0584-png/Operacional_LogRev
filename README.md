# Dashboard Operacional LogRev

## 1. Objetivo

O **Dashboard Operacional LogRev** acompanha diariamente o desempenho da operação de logística reversa, consolidando dados de baixas, internalizações, metas, ritmo, estoques e previsão de entrega.

O painel foi desenvolvido para exibição em TV, computador e celular, com atualização automatizada por VBA, OneDrive, Power Automate, GitHub e Microsoft Teams.

---

## 2. Visões disponíveis

### 2.1 Baixados

Exibe o volume baixado no dia por agente ou armazém agrupado.

Principais características:

- considera a data mais recente disponível em `baixados.csv`;
- separa os volumes por tipo de desconexão;
- apresenta o volume total em cada barra;
- exibe indicadores diários e mensais na parte superior.

### 2.2 Internalizado

Exibe o volume internalizado no dia por origem.

Principais características:

- considera a data mais recente disponível em `internalizados.csv`;
- separa os volumes por tipo de desconexão;
- exibe os volumes diário e acumulado do mês.

### 2.3 Metas Terceiras

Apresenta o acompanhamento das metas por UF e terceira.

Cada card mostra:

- Meta;
- Baixado hoje;
- Internalizado no mês;
- Estoque;
- Previsão de fechamento;
- Falta coletar;
- Motoqueiros;
- Responsável;
- percentual de ritmo.

A ordenação começa pelas terceiras com menor ritmo.

A visão possui:

- duas páginas automáticas;
- troca interna aos 15 segundos;
- setas para avançar ou voltar manualmente no computador e no celular.

### 2.4 Ritmo do Mês

Apresenta uma comparação direta do ritmo já existente na visão **Metas Terceiras**.

A tabela contém somente:

- Terceira;
- Responsável;
- Ritmo.

Regras:

- o percentual é lido diretamente do campo `Ritmo` do arquivo `metas_terceiras.csv`;
- não existe um segundo cálculo de ritmo no dashboard;
- a ordenação ocorre do maior percentual para o menor;
- a coluna Ritmo apresenta o percentual e uma barra de preenchimento;
- a visão possui duas páginas automáticas;
- a troca interna ocorre aos 15 segundos;
- as setas permitem navegação manual no computador e no celular.

Cards do calendário operacional:

- **Dias úteis do mês:** total de dias úteis do período;
- **Dias úteis transcorridos:** valor de `Dias_Uteis_Atual`;
- **Dias úteis restantes:** valor da coluna `Sub`, exportada como `Dias_Uteis_Restantes`.

### 2.5 Estoques

A visão de estoques possui duas apresentações internas:

- **Terceiras:** estoque dos terceiros de coleta;
- **Lojas por UF:** estoque consolidado das lojas.

A alternância interna ocorre durante o tempo da visão.

### 2.6 Previsão Entrega

Exibe os armazéns ou equipes com entrega prevista para a data atual.

A fonte utilizada é `previsao_entrega.csv`.

---

## 3. Indicadores superiores

Os cards superiores do dashboard apresentam os principais números operacionais, incluindo:

- baixados hoje;
- baixados no mês;
- estoque D-1 das terceiras;
- internalizados hoje;
- internalizados no mês.

Quando não houver movimento no dia, o painel pode informar a última movimentação disponível.

---

## 4. Faixa Destaques

A faixa fixa na parte inferior mostra o desempenho das terceiras por grupos:

- **BOM RITMO:** ritmo igual ou superior a 80%;
- **ATENÇÃO:** ritmo entre 60% e 79,9%;
- **PRIORIDADE:** ritmo abaixo de 60%.

Velocidades atuais:

- BOM RITMO: 40 segundos;
- ATENÇÃO: 25 segundos;
- PRIORIDADE: 45 segundos.

A duração de cada grupo está sincronizada com a animação para evitar corte ou troca antecipada.

---

## 5. Rotação e atualização automática

- cada visão principal permanece por 30 segundos;
- páginas internas de Metas Terceiras e Ritmo do Mês mudam aos 15 segundos;
- o dashboard realiza atualização completa da página a cada 30 minutos;
- o contador da próxima visão aparece na parte superior;
- o contador de atualização aparece na faixa inferior.

As setas manuais não desativam a rotação automática.

---

## 6. Arquivos de dados

Os arquivos ficam na pasta `data` do repositório:

```text
data/baixados.csv
data/internalizados.csv
data/estoque.csv
data/previsao_entrega.csv
data/metas_terceiras.csv
```

### Campos adicionais de metas_terceiras.csv

A visão de calendário utiliza:

```text
Mes_Atual
Dias_Uteis_Mes
Dias_Uteis_Atual
Dias_Uteis_Restantes
```

No Excel, as colunas de origem são:

```text
Mês Atual
Dias Úteis Mês
Dias Úteis Atual
Sub
```

A coluna `Sub` representa:

```text
Dias úteis restantes = Dias úteis do mês - Dias úteis transcorridos
```

---

## 7. Arquivos do dashboard

Estrutura principal do repositório:

```text
index.html
app.js
style.css
assets/logo-alares.png
data/
```

Responsabilidades:

- `index.html`: estrutura principal da página;
- `app.js`: leitura dos CSVs, cálculos, visões, rotação e navegação;
- `style.css`: aparência, responsividade, tabelas, cards e animações;
- `assets/logo-alares.png`: identidade visual;
- `data/`: bases publicadas automaticamente.

---

## 8. Processo de atualização

Fluxo completo:

```text
Excel/VBA
→ exporta os cinco CSVs
→ atualiza Atualizar_Dashboard.txt com data e hora
→ OneDrive sincroniza os arquivos
→ Power Automate é acionado pelo sinalizador
→ Power Automate lê os cinco CSVs
→ cria cinco blobs no GitHub
→ cria uma única árvore
→ cria um único commit
→ atualiza a branch main
→ aguarda o GitHub Pages concluir o deploy
→ envia confirmação no Microsoft Teams
```

Esse processo garante:

- um único commit por atualização;
- um único deploy do GitHub Pages;
- publicação conjunta dos cinco CSVs;
- mensagem no Teams somente depois da conclusão real do deploy.

---

## 9. VBA

A macro principal é:

```text
ExportarCSVsDashboard
```

A rotina:

1. valida a pasta de exportação;
2. exporta os cinco CSVs em UTF-8;
3. atualiza `Atualizar_Dashboard.txt` somente após sucesso completo;
4. grava data e hora no sinalizador;
5. não aciona o Power Automate se alguma exportação falhar.

Pasta configurada:

```text
C:\Users\souza.igor\OneDrive - VIDEOMAR REDE NORDESTE S A\Base_Operacional
```

---

## 10. Power Automate

O fluxo monitora exclusivamente:

```text
Atualizar_Dashboard.txt
```

Condição do gatilho:

```text
@equals(triggerOutputs()?['headers']?['x-ms-file-name'], 'Atualizar_Dashboard.txt')
```

Configurações importantes:

- controle de concorrência ativado;
- grau de paralelismo igual a 1;
- espera inicial para sincronização do OneDrive;
- criação de um único commit com os cinco CSVs;
- consulta ao workflow do GitHub Pages até retornar `completed` e `success`;
- envio da mensagem no Teams somente após o deploy.

---

## 11. GitHub

Repositório:

```text
https://github.com/igorsilva0584-png/Operacional_LogRev
```

Dashboard:

```text
https://igorsilva0584-png.github.io/Operacional_LogRev/
```

Permissões necessárias no token:

```text
Contents: Read and write
Actions: Read-only
Metadata: Read-only
```

Quando o token vencer, as ações HTTP podem retornar erro 401 ou 403. Será necessário gerar ou renovar o token e atualizar os cabeçalhos de autorização do fluxo.

---

## 12. Microsoft Teams

Após o deploy concluído, o fluxo envia uma mensagem informando que o dashboard foi atualizado.

A mensagem contém:

- confirmação da atualização;
- data e hora;
- link clicável para o dashboard.

---

## 13. Responsividade

O dashboard está preparado para:

- TV corporativa;
- monitor de computador;
- notebook;
- tablet;
- celular.

Em telas menores:

- a navegação pode quebrar em mais linhas;
- tabelas podem usar rolagem horizontal;
- setas possuem área maior para toque;
- cards se reorganizam verticalmente.

---

## 14. Manutenção

### Para alterar dados

Execute a macro no Excel. Não altere manualmente os CSVs do GitHub.

### Para alterar o layout

Normalmente, substitua:

```text
app.js
style.css
```

### Para testar após um deploy

Atualize o navegador com:

```text
Ctrl + F5
```

### Para conferir falhas

Verifique:

1. execução da macro;
2. sincronização do OneDrive;
3. histórico do Power Automate;
4. commit no GitHub;
5. workflow do GitHub Pages;
6. mensagem no Teams.

---

## 15. Versão consolidada

Esta documentação consolida as funcionalidades disponíveis até o ajuste de inclusão das setas manuais em **Metas Terceiras**, mantendo também as setas em **Ritmo do Mês** e a velocidade reduzida do grupo **PRIORIDADE**.
