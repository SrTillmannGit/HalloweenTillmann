# Avistou alguma anomalia? — site do QR code de Halloween

Quem escaneia o QR do cartaz cai no site, tira uma foto da "anomalia", escreve onde viu e envia.
As fotos aparecem num mural que todo mundo vê e que se atualiza sozinho. No fim da noite, o
botão **Modo telão** passa todas as fotos em tela cheia, 5 segundos cada (bom para projetar ou
gravar o compilado).

Clima da página: rosto cujos olhos seguem o cursor e piscam, boca com dentes e sangue ao tocar
no rosto, sons de terror nos botões, trilha ambiente e um susto com grito ao registrar. Todos os
sons são sintetizados no navegador (Web Audio), sem arquivos de áudio.

## Arquivos
- `index.html` – o site
- `config.js` – onde entram as chaves do Supabase
- `supabase-setup.sql` – cria a tabela e o bucket das fotos
- `qr.html` – gera o QR code em PNG para colar no cartaz
- `rosto.jpg`, `cartaz.jpg` – imagens

Sem chaves no `config.js`, o site roda em **modo teste** (só salva no próprio navegador).

## Colocar no ar (grátis)
1. **Banco de fotos:** crie uma conta em supabase.com → New project. Em *SQL Editor*, cole
   o conteúdo de `supabase-setup.sql` e clique *Run*.
2. Em *Project Settings → API*, copie a **Project URL** e a chave **anon public** para o `config.js`.
   A chave anon pode ficar pública: as regras do banco só permitem enviar e ver avistamentos.
3. **Hospedagem:** no Netlify, *Add new site → Import an existing project → GitHub* e escolha este
   repositório (sem comando de build, diretório de publicação = raiz). A cada push o site atualiza.
4. Abra `https://<seu-site>.netlify.app/qr.html`, baixe o PNG e coloque no cartaz.
5. Teste escaneando com o celular e enviando uma foto antes de imprimir.

## Depois da festa
Todas as fotos ficam no Supabase em *Storage → avistamentos* e os relatos em
*Table Editor → avistamentos*. Para apagar uma foto indevida, exclua a linha e o arquivo por lá.
