
  # Untitled

  This is a code bundle for Untitled. The original project is available at https://www.figma.com/design/HideK4GO5UCFX9AgR6DaMK/Untitled.

  ## Running the project locally

  ### 1) Start the backend (FastAPI)

  ```bash
  # from the frontend folder
  cd ../farmback
  python -m venv .venv
  source .venv/bin/activate
  pip install -r requirements.txt
  uvicorn main:app --reload --host 0.0.0.0 --port 8000
  ```

  ### 2) Start the frontend (Vite)

  ```bash
  cd ../farmfront
  npm install
  npm run dev
  ```


A FarmaMap é uma aplicação digital que funciona como um agregador de farmácias, permitindo a integração de múltiplos estabelecimentos numa única plataforma. Tecnicamente, a app recolhe e centraliza dados de inventário, preços e localização das farmácias parceiras, disponibilizando essas informações ao utilizador através de um sistema de pesquisa inteligente e geolocalização.
O sistema permite que o utilizador pesquise medicamentos, visualize a disponibilidade em diferentes farmácias, compare preços e realize encomendas diretamente na plataforma. A aplicação também inclui funcionalidades de gestão de pedidos, cálculo de custos de entrega, escolha entre levantamento em loja ou entrega ao domicílio, e integração com sistemas de pagamento ou seguradoras para cobertura de medicamentos.
Do ponto de vista técnico, a plataforma envolve módulos de gestão de utilizadores, catálogo de medicamentos, integração com bases de dados de farmácias, processamento de pedidos, e APIs para comunicação com serviços externos como pagamentos, logística e seguradoras. O objetivo é criar um ecossistema digital que conecte consumidores, farmácias e parceiros de saúde num único sistema eficiente e escalável.