// Sistema PDV - Mercadinho Morezine
// Banco de dados local (localStorage)

// Dados iniciais
let produtos = JSON.parse(localStorage.getItem("produtos")) || [
    { id: "001", nome: "Arroz 5kg", preco: 22.90, estoque: 50, categoria: "alimentos", balanca: false },
    { id: "002", nome: "Feijão 1kg", preco: 8.50, estoque: 40, categoria: "alimentos", balanca: false },
    { id: "003", nome: "Maçã", preco: 8.99, estoque: 30, categoria: "alimentos", balanca: true },
    { id: "004", nome: "Carne Bovina", preco: 39.90, estoque: 20, categoria: "alimentos", balanca: true },
    { id: "005", nome: "Leite 1L", preco: 4.50, estoque: 60, categoria: "alimentos", balanca: false },
];

let vendas = JSON.parse(localStorage.getItem("vendas")) || [];
let carrinhoAtual = [];
let metodoPagamento = "dinheiro";
let configSistema = JSON.parse(localStorage.getItem("configSistema")) || {
    impressora: { modelo: "epson", porta: "COM1" },
    balanca: { 
        modelo: "toledo_prix3", 
        porta: "COM3", 
        portaAlternativa: "COM4",
        baudRate: 4800,
        protocolo: "toledo_standard",
        simulado: true
    },
    empresa: { nome: "Mercadinho Morezine", cnpj: "", endereco: "" }
};

// Função para salvar dados automaticamente
function salvarDadosAutomaticamente(tipo, dados) {
    
    // Salvar no localStorage
    localStorage.setItem(tipo, JSON.stringify(dados));
    
    // Atualizar a interface imediatamente conforme o tipo salvo
    try {
        if (tipo === 'produtos') {
            produtos = JSON.parse(localStorage.getItem('produtos')) || [];
            if (typeof carregarProdutos === 'function') carregarProdutos();
        } else if (tipo === 'vendas') {
            vendas = JSON.parse(localStorage.getItem('vendas')) || [];
            if (typeof carregarVendas === 'function') carregarVendas();
        } else if (tipo === 'configSistema') {
            configSistema = JSON.parse(localStorage.getItem('configSistema')) || {};
            if (typeof carregarConfiguracoes === 'function') carregarConfiguracoes();
        }
    } catch (e) {
        console.warn('Falha ao atualizar interface após salvar dados:', e);
    }
    
    // Opcional: emitir um evento customizado para outras partes do sistema
    try {
        window.dispatchEvent(new CustomEvent('dados-salvos', { detail: { tipo } }));
    } catch (_) {}
    
    // Mostrar notificação
    mostrarNotificacaoSalvamento();
    // (Atualização de memória já realizada acima junto do refresh da interface)
}

// Função para mostrar notificação de salvamento
function mostrarNotificacaoSalvamento() {
    // Criar elemento de notificação se não existir
    let notificacao = document.getElementById('notificacao-salvamento');
    if (!notificacao) {
        notificacao = document.createElement('div');
        notificacao.id = 'notificacao-salvamento';
        notificacao.style.position = 'fixed';
        notificacao.style.bottom = '20px';
        notificacao.style.right = '20px';
        notificacao.style.backgroundColor = '#4CAF50';
        notificacao.style.color = 'white';
        notificacao.style.padding = '10px 20px';
        notificacao.style.borderRadius = '5px';
        notificacao.style.zIndex = '1000';
        notificacao.style.opacity = '0';
        notificacao.style.transition = 'opacity 0.3s ease-in-out';
        document.body.appendChild(notificacao);
    }
    
    // Mostrar notificação
    notificacao.textContent = 'Dados salvos com sucesso!';
    notificacao.style.opacity = '1';
    
    // Esconder após 2 segundos
    setTimeout(() => {
        notificacao.style.opacity = '0';
    }, 2000);
}

// Função para buscar produto por código ou nome
function buscarProdutoPorCodigoOuNome(busca) {
    return produtos.find(p => p.id === busca || p.nome.toLowerCase().includes(busca.toLowerCase()));
}

// Inicialização do sistema
document.addEventListener("DOMContentLoaded", () => {
    // Configurar eventos primeiro
    configurarEventos();
    
    //Verificar login
    if (!localStorage.getItem("logado")) {
        mostrarTelaLogin();
    } else {
        mostrarSistemaPrincipal();
    }

    // Adicionar listener para eventos de storage
    window.addEventListener('storage', verificarEstadoLogin);
    
    // Função para verificar estado de login
    function verificarEstadoLogin() {
        if (!localStorage.getItem("logado")) {
            mostrarTelaLogin();
        } else {
            mostrarSistemaPrincipal();
        }
    }
    
    //Carregar dados
    carregarProdutos();
    carregarVendas();
    carregarConfiguracoes();
    
    // Configurar salvamento automático
    configurarSalvamentoAutomatico();
});

// Configurar salvamento automático para garantir que os dados sejam salvos sem precisar de F5
function configurarSalvamentoAutomatico() {
    // Adicionar evento de beforeunload para salvar dados antes de fechar a página
    window.addEventListener('beforeunload', function() {
        salvarDadosAutomaticamente('produtos', produtos);
        salvarDadosAutomaticamente('vendas', vendas);
        salvarDadosAutomaticamente('configSistema', configSistema);
    });
    
    // Adicionar evento de storage para sincronizar dados entre abas
    window.addEventListener('storage', function(e) {
        if (e.key === 'produtos') {
            produtos = JSON.parse(localStorage.getItem('produtos')) || [];
            carregarProdutos();
        } else if (e.key === 'vendas') {
            vendas = JSON.parse(localStorage.getItem('vendas')) || [];
            carregarVendas();
        } else if (e.key === 'configSistema') {
            configSistema = JSON.parse(localStorage.getItem('configSistema')) || {};
            carregarConfiguracoes();
        }
    });
    
    // Salvar dados a cada 30 segundos automaticamente
    setInterval(function() {
        salvarDadosAutomaticamente('produtos', produtos);
        salvarDadosAutomaticamente('vendas', vendas);
        salvarDadosAutomaticamente('configSistema', configSistema);
    }, 30000);
}

function mostrarTelaLogin() {
    document.getElementById("login-screen").classList.remove("hidden");
    document.getElementById("main-system").classList.add("hidden");
}

function mostrarSistemaPrincipal() {
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("main-system").classList.remove("hidden");
}

function mostrarPagina(pagina) {
    // Ocultar todas as páginas
    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });
    
    // Mostrar página selecionada
    document.getElementById(`${pagina}-page`).classList.add("active");
    
    // Atualizar menu
    document.querySelectorAll(".menu li").forEach(item => {
        if (item.dataset.page === pagina) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    // Focar no campo de busca ao entrar na página PDV
    if (pagina === "pdv") {
        const inputProduto = document.getElementById("product-search");
        if (inputProduto) {
            inputProduto.focus();
        }
    }
}

//Vamos ver
function mostrarModal(modalId) {
    document.getElementById(modalId).style.display = "block";
}

function fecharModal(modalId) {
    document.getElementById(modalId).style.display = "none";
    // Retornar foco ao campo de leitura do produto no PDV
    const pdvAtivo = document.getElementById("pdv-page") && document.getElementById("pdv-page").classList.contains("active");
    const inputProduto = document.getElementById("product-search");
    if (pdvAtivo && inputProduto) {
        inputProduto.focus();
    }
}

// Configuração de eventos
function configurarEventos() {
    //Login
    document.getElementById("login-form").addEventListener("submit", fazerLogin);
    
    // Menu
    document.querySelectorAll(".menu li").forEach(item => {
        if (!item.id) {
            item.addEventListener("click", () => mostrarPagina(item.dataset.page));
        }
    });
    
    document.getElementById("logout").addEventListener("click", fazerLogout);
    
    // Botão limpar relatório
    document.getElementById("limpar-relatorio-btn").addEventListener("click", limparRelatorio);
}

    // Função para limpar relatório de vendas
function limparRelatorio() {
    if (confirm("Tem certeza que deseja limpar todo o histórico de vendas? Esta ação não pode ser desfeita.")) {
        // Limpar array de vendas
        vendas = [];
        
        // Salvar no localStorage
        salvarDadosAutomaticamente("vendas", vendas);
        
        // Atualizar interface
        carregarVendas();
        
        // Atualizar valores dos cards
        document.getElementById("total-vendas").textContent = "R$ 0,00";
        document.getElementById("qtd-vendas").textContent = "0";
        document.getElementById("ticket-medio").textContent = "R$ 0,00";
        
        // Mostrar mensagem de sucesso
        alert("Relatório de vendas limpo com sucesso!");
    }
}
    
// continua   
function salvarProduto() {
  const indexStr = document.getElementById('produto-id').value;
  const isNovo = indexStr === '';
  const index = isNovo ? -1 : parseInt(indexStr, 10);

  const codigo = document.getElementById('produto-codigo').value.trim();
  const nome = document.getElementById('produto-nome').value.trim();
  const preco = parseFloat(document.getElementById('produto-preco').value);
  const estoque = parseInt(document.getElementById('produto-estoque').value);
  const categoria = document.getElementById('produto-categoria').value;
  const balanca = document.getElementById('produto-balanca').checked;

  if (!codigo || !nome || isNaN(preco) || (!balanca && isNaN(estoque)) || !categoria) {
    alert('Preencha todos os campos corretamente!');
    return;
  }

  if (preco <= 0) {
    alert('Preço deve ser maior que zero!');
    return;
  }

  if (!balanca && estoque < 0) {
    alert('Estoque não pode ser negativo!');
    return;
  }

  // Evita duplicação de código, exceto se for edição do produto atual
  if (produtos.some((p, i) => p.id === codigo && i !== index)) {
    alert('Já existe um produto com este código!');
    return;
  }

  const produto = {
    id: codigo,
    nome: nome,
    preco: preco,
    estoque: balanca ? 0 : estoque,
    categoria: categoria,
    balanca: balanca
  };

  if (isNovo) {
    produtos.push(produto);
  } else {
    produtos[index] = produto;
  }

  salvarDadosAutomaticamente('produtos', produtos);
  carregarProdutos();
  fecharModal('produto-modal');
}
    
    // PDV
    document.getElementById("search-btn").addEventListener("click", buscarProduto);
    document.getElementById("product-search").addEventListener("keypress", (e) => {
        if (e.key === "Enter") buscarProduto();
    });
    document.getElementById("balanca-btn").addEventListener("click", () => mostrarModal("balanca-modal"));
    document.getElementById("finalizar-venda").addEventListener("click", iniciarFinalizacaoVenda);
    document.getElementById("cancelar-venda").addEventListener("click", cancelarVenda);
    
    // Adicionar evento para tecla Enter no campo valor recebido
    document.getElementById("valor-recebido").addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            calcularTroco();
            if (parseFloat(document.getElementById("valor-recebido").value) >=
                carrinhoAtual.reduce((soma, item) => soma + item.subtotal, 0)) {
                finalizarVenda();
            }
        }
    });

    // Listener único para salvar produto
    document.getElementById('save-produto').addEventListener('click', function (event) {
      event.preventDefault();
      salvarProduto();
    });
    
    // Formas de pagamento
    document.querySelectorAll(".payment-btn").forEach(btn => {
        btn.addEventListener("click", () => selecionarFormaPagamento(btn.dataset.method));
    });

    //Comeso do novo codigo
    function diagnosticoProdutos(produtos) {
  const relatorio = [];
  const codigos = new Set();

  produtos.forEach(p => {
    const erros = [];

    if (!p.id) {
      erros.push('Código não informado');
    } else if (codigos.has(p.id)) {
      erros.push('Código duplicado');
    } else {
      codigos.add(p.id);
    }

    if (!p.nome) {
      erros.push('Nome não informado');
    }

    if (typeof p.preco !== 'number' || p.preco <= 0) {
      erros.push('Preço inválido ou não informado');
    }

    if (typeof p.estoque !== 'number' || p.estoque < 0) {
      erros.push('Estoque inválido ou negativo');
    }

    if (!p.categoria) {
      erros.push('Categoria não informada');
    }

    if (typeof p.balanca !== 'boolean') {
      erros.push('Campo balança inválido');
    }

    if (erros.length > 0) {
      relatorio.push({
        produto: p.nome || 'Sem nome',
        id: p.id || 'Sem código',
        erros: erros
      });
    }
  });

  return relatorio;
}

// Exemplo de uso
 //Removendo o código problemático que estava causando conflito com a variável global produtos
 //e usando apenas o relatório de diagnóstico com os produtos já carregados
const relatorioDiagnostico = diagnosticoProdutos(produtos);

if (relatorioDiagnostico.length > 0) {
  console.log('Produtos com problemas encontrados:', relatorioDiagnostico);
  // Aqui, você pode exibir na interface a lista com esses problemas para o operador
} else {
  console.log('Nenhum problema encontrado nos produtos.');
}
    
    // Removido bloco duplicado de exemplo/json e implementação redundante de salvarProduto

    // Estoque
    document.getElementById("add-product").addEventListener("click", () => {
        document.getElementById("produto-modal-title").textContent = "Novo Produto";
        document.getElementById("produto-form").reset();
        document.getElementById("produto-id").value = "";
        mostrarModal("produto-modal");
    });
    
    document.getElementById("estoque-search-btn").addEventListener("click", buscarProdutoEstoque);
    
    // Adicionar evento para pesquisa com Enter no campo de estoque
    document.getElementById("estoque-search").addEventListener("keypress", (e) => {
        if (e.key === "Enter") buscarProdutoEstoque();
    });
    
    // Remover evento automático para permitir múltiplas pesquisas sem interferência
    
    // Modais
    document.querySelectorAll(".close, .close-modal").forEach(el => {
        el.addEventListener("click", () => {
            // Fechar todos os modais
            document.querySelectorAll(".modal").forEach(modal => {
                modal.style.display = "none";
            });
        });
    });
    
    // Produto (listener já definido acima)
    
    // Balança
    document.getElementById("ler-balanca").addEventListener("click", lerBalanca);
    document.getElementById("add-balanca-item").addEventListener("click", adicionarItemBalanca);
    atualizarIndicadorSimulador();
    
    // Permitir entrada manual de peso com Enter
    document.getElementById("balanca-peso").addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            adicionarItemBalanca();
        }
    });
    
    // Pagamento
    document.getElementById("valor-recebido").addEventListener("input", calcularTroco);
    document.getElementById("confirmar-pagamento").addEventListener("click", finalizarVenda);
    
    // Configurações
    document.getElementById("save-config").addEventListener("click", salvarConfiguracoes);
    
    // Relatórios
    document.getElementById("filter-btn").addEventListener("click", filtrarRelatorios);

// Funções de autenticação
function fazerLogin(e) {
    e.preventDefault();
    const username = document.getElementById("username").value;
    
    // Autenticação simples apenas com usuário
    if (username.toLowerCase() === "admin") {
        salvarDadosAutomaticamente("logado", "true");
        mostrarSistemaPrincipal();
        console.log("Login bem-sucedido!");
    } else {
        alert("Usuário incorreto! Use 'admin'");
        console.log("Falha no login - usuário incorreto");
    }
}

function fazerLogout() {
    localStorage.removeItem("logado");
    window.dispatchEvent(new Event('storage'));
    mostrarTelaLogin();
}

// Funções do PDV
function buscarProduto() {
    const busca = document.getElementById("product-search").value.trim();
    if (!busca) return;

    const produto = buscarProdutoPorCodigoOuNome(busca);

    if (produto) {
         //Se for produto de balança, verificar se tem peso
        if (produto.balanca) {
            // Mostrar modal da balança com o produto já selecionado
            document.getElementById("balanca-produto").value = produto.id;
            mostrarModal("balanca-modal");
        } else {
            // Produto normal, adicionar diretamente
            adicionarAoCarrinho(produto, "1");
        }
        document.getElementById("product-search").value = "";
        document.getElementById("product-search").focus();
    } else {
        alert("Produto não encontrado!");
        const inputProduto = document.getElementById("product-search");
        if (inputProduto) inputProduto.focus();
    }
}

function adicionarAoCarrinho(produto, quantidade) {
    const itemExistente = carrinhoAtual.find(item => item.id === produto.id);
    
    if (itemExistente) {
        itemExistente.quantidade += quantidade;
        itemExistente.subtotal = itemExistente.quantidade * itemExistente.preco;
    } else {
        carrinhoAtual.push({
            id: produto.id,
            nome: produto.nome,
            preco: produto.preco,
            quantidade: quantidade,
            subtotal: produto.preco * quantidade
        });
    }
    
    atualizarCarrinho();
}

function removerDoCarrinho(indice) {
    carrinhoAtual.splice(indice, 1);
    atualizarCarrinho();
}

function atualizarQuantidade(index, novaQuantidade) {
    if (novaQuantidade <= 0) {
        removerDoCarrinho(index);
        return;
    }
    
    carrinhoAtual[index].quantidade = novaQuantidade;
    carrinhoAtual[index].subtotal = carrinhoAtual[index].preco * novaQuantidade;
    atualizarCarrinho();
}

function atualizarCarrinho() {
    const tbody = document.getElementById("cart-body");
    tbody.innerHTML = "";
    
    carrinhoAtual.forEach((item, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${item.id}</td>
            <td>${item.nome}</td>
            <td>
                <input type="number" value="${item.quantidade}" min="1" 
                       onchange="atualizarQuantidade(${index}, this.value)">
            </td>
            <td>R$ ${item.preco.toFixed(2)}</td>
            <td>R$ ${item.subtotal.toFixed(2)}</td>
            <td>
                <button onclick="removerDoCarrinho(${index})" class="btn-danger">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Atualizar total
    const total = carrinhoAtual.reduce((soma, item) => soma + item.subtotal, 0);
    document.getElementById("total-value").textContent = `R$ ${total.toFixed(2)}`;
}

function selecionarFormaPagamento(metodo) {
    metodoPagamento = metodo;
    
    // Atualizar visual dos botões
    document.querySelectorAll(".payment-btn").forEach(btn => {
        if (btn.dataset.method === metodo) {
            btn.classList.add("selected");
        } else {
            btn.classList.remove("selected");
        }
    });
}

function iniciarFinalizacaoVenda() {
    if (carrinhoAtual.length === 0) {
        alert("Carrinho vazio!");
        return;
    }
    
    const total = carrinhoAtual.reduce((soma, item) => soma + item.subtotal, 0);
    document.getElementById("modal-total").textContent = `R$ ${total.toFixed(2)}`;
    
    // Mostrar/ocultar campos baseado no método de pagamento
    if (metodoPagamento === "dinheiro") {
        document.getElementById("dinheiro-row").style.display = "flex";
        document.getElementById("troco-row").style.display = "flex";
    } else {
        document.getElementById("dinheiro-row").style.display = "none";
        document.getElementById("troco-row").style.display = "none";
    }
    
    mostrarModal("pagamento-modal");
}

function calcularTroco() {
    if (metodoPagamento !== "dinheiro") return;
    
    const total = carrinhoAtual.reduce((soma, item) => soma + item.subtotal, 0);
    const valorRecebido = parseFloat(document.getElementById("valor-recebido").value) || 0;
    const troco = valorRecebido - total;
    
    const trocoValorElement = document.getElementById("troco-valor");
    if (trocoValorElement) {
        trocoValorElement.textContent = troco >= 0 ?
            `R$ ${troco.toFixed(2)}` :
            "Valor insuficiente";
        
        // Habilitar ou desabilitar o botão de confirmar pagamento
        const confirmarBtn = document.getElementById("confirmar-pagamento");
        if (confirmarBtn) {
            confirmarBtn.disabled = (troco < 0);
        }
    } else {
        console.error("Elemento troco-valor não encontrado");
    }
    
    return troco;
}

function finalizarVenda() {
    const total = carrinhoAtual.reduce((soma, item) => soma + item.subtotal, 0);
    
    if (metodoPagamento === "dinheiro") {
        const valorRecebido = parseFloat(document.getElementById("valor-recebido").value) || 0;
        
        if (valorRecebido < total) {
            alert("O valor recebido é menor que o total da compra!");
            return;
        }
        
        // Calcular e mostrar o troco
        const troco = calcularTroco();
        if (troco < 0) {
            return; // Não finalizar se o troco for negativo
        }
    }
    
    // Criar venda
    const venda = {
        id: Date.now().toString(),
        data: new Date().toISOString(),
        itens: [...carrinhoAtual],
        total: total,
        pagamento: metodoPagamento
    }
    
    // Atualizar estoque
    carrinhoAtual.forEach(item => {
        const produto = produtos.find(p => p.id === item.id);
        if (produto && !produto.balanca) {
            produto.estoque -= item.quantidade;
        }
    })
    
    // Salvar dados
    vendas.push(venda);
    salvarDadosAutomaticamente("vendas", vendas);
    salvarDadosAutomaticamente("produtos", produtos);
    
    // Imprimir cupom
    imprimirCupom(venda);
    
    // Limpar carrinho e fechar modal
    carrinhoAtual = [];
    atualizarCarrinho();
    fecharModal("pagamento-modal");
    
    alert("Venda finalizada com sucesso!");
}

function cancelarVenda() {
    if (confirm("Deseja realmente cancelar a venda atual?")) {
        carrinhoAtual = [];
        atualizarCarrinho();
    }
}

// Funções da balança
function lerBalanca() {
    // Simulação de leitura da balança com feedback visual
    const botaoLer = document.getElementById("ler-balanca");
    const campoPeso = document.getElementById("balanca-peso");
    
    // Desabilitar botão e mostrar que está lendo
    botaoLer.disabled = true;
    botaoLer.textContent = "Lendo...";
    
    // Simular tempo de leitura da balança (1-2 segundos)
    setTimeout(() => {
        try {
            // Verificar configuração da balança
            const configBalanca = configSistema.balanca;
            const modeloBalanca = configBalanca?.modelo || "toledo";
            const porta = configBalanca?.porta || "COM3";
            const baudRate = configBalanca?.baudRate || 4800;
            const simulado = !!configBalanca?.simulado;
            // Ajustar texto do botão conforme modo
            botaoLer.textContent = simulado ? "Simulando..." : "Aguardando...";

            console.log(`Tentando ler balança ${modeloBalanca} na porta ${porta} (${baudRate} bps)...`);

            if (simulado) {
                // Bloquear entrada manual/teclado da balança enquanto simula
                campoPeso.readOnly = true;
                campoPeso.blur();
                campoPeso.value = "";

                // Simular leitura específica para Toledo Prix 3
                let peso;
                if (modeloBalanca === "toledo_prix3") {
                    // Toledo Prix 3: precisão de 5g, capacidade até 15kg
                    // Simular peso mais realista com incrementos de 5g
                    const pesoBase = Math.random() * 15; // 0 a 15kg
                    peso = (Math.round(pesoBase * 200) / 200).toFixed(3); // Arredondar para 5g (0.005kg)

                    // Simular possível instabilidade da balança (peso oscilando)
                    if (Math.random() < 0.1) { // 10% de chance de instabilidade
                        campoPeso.value = "-----";
                        setTimeout(() => {
                            campoPeso.value = peso;
                            campoPeso.style.backgroundColor = "#e8f5e8";
                            setTimeout(() => campoPeso.style.backgroundColor = "", 1000);
                        }, 500);
                        console.log(`Toledo Prix 3: Peso instável, estabilizando... ${peso}kg`);
                        return;
                    }
                } else if (modeloBalanca === "toledo") {
                    // Toledo genérico (0.1kg a 10kg)
                    peso = (0.1 + Math.random() * 9.9).toFixed(3);
                } else if (modeloBalanca === "filizola") {
                    // Filizola (0.05kg a 15kg)
                    peso = (0.05 + Math.random() * 14.95).toFixed(3);
                } else {
                    // Simulação genérica (0.1kg a 5kg)
                    peso = (0.1 + Math.random() * 4.9).toFixed(3);
                }

                campoPeso.value = peso;

                // Feedback visual de sucesso
                campoPeso.style.backgroundColor = "#e8f5e8";
                setTimeout(() => {
                    campoPeso.style.backgroundColor = "";
                }, 1000);

                console.log(`Peso lido da balança ${modeloBalanca} (${porta}, ${baudRate} bps): ${peso}kg`);
            } else {
                // Modo real: não escrever no campo, permitir que a balança (HID/COM via app) preencha
                console.log("Modo real ativado. Em ambiente web, a leitura direta de portas COM não é acessível; se sua balança atua como 'teclado', mantenha o campo focado para digitar automaticamente.");
                // Indicar visualmente que está aguardando a leitura real
                campoPeso.placeholder = "Aguardando leitura da balança (real)...";
            }
            
        } catch (error) {
             console.error("Erro ao ler balança:", error);
             
             // Tentar porta alternativa se disponível
             const portaAlternativa = configBalanca?.portaAlternativa;
             if (portaAlternativa && porta !== portaAlternativa) {
                 console.log(`Tentando porta alternativa: ${portaAlternativa}`);
                 alert(`Erro na porta ${porta}. Tentando porta ${portaAlternativa}...`);
             } else {
                 alert(`Erro ao comunicar com a balança Toledo Prix 3.\nVerifique:\n- Conexão na porta ${porta}\n- Velocidade configurada: ${baudRate} bps\n- Balança ligada e estável`);
             }
             
             campoPeso.style.backgroundColor = "#ffe8e8";
             setTimeout(() => {
                 campoPeso.style.backgroundColor = "";
             }, 1000);
         } finally {
            // Reabilitar botão
            botaoLer.disabled = false;
            botaoLer.textContent = "Ler da Balança";
            // Restaurar estado do campo
            campoPeso.readOnly = false;
            campoPeso.placeholder = "";
        }
    }, 1000 + Math.random() * 1000); // 1-2 segundos de delay
}

function adicionarItemBalanca() {
    const produtoId = document.getElementById("balanca-produto").value;
    const peso = parseFloat(document.getElementById("balanca-peso").value);
    
    // Validações mais robustas
    if (!produtoId) {
        alert("Selecione um produto!");
        return;
    }
    
    if (!peso || peso <= 0) {
        alert("Informe um peso válido maior que zero!");
        document.getElementById("balanca-peso").focus();
        return;
    }
    
    if (peso > 50) {
        if (!confirm(`Peso muito alto (${peso}kg). Deseja continuar?`)) {
            return;
        }
    }
    
    const produto = produtos.find(p => p.id === produtoId);
    
    if (!produto) {
        alert("Produto não encontrado!");
        return;
    }
    
    if (!produto.balanca) {
        alert("Este produto não é vendido por peso!");
        return;
    }
    
    // Adicionar ao carrinho com feedback
    try {
        adicionarAoCarrinho(produto, peso);
        
        // Limpar campos para próxima pesagem
        document.getElementById("balanca-peso").value = "";
        
        // Mostrar confirmação
        console.log(`Produto adicionado: ${produto.nome} - ${peso}kg - R$ ${(produto.preco * peso).toFixed(2)}`);
        
        fecharModal("balanca-modal");
        
        // Feedback visual no carrinho
        setTimeout(() => {
            const carrinhoElement = document.querySelector(".cart-items");
            if (carrinhoElement) {
                carrinhoElement.style.backgroundColor = "#e8f5e8";
                setTimeout(() => {
                    carrinhoElement.style.backgroundColor = "";
                }, 1000);
            }
        }, 100);
        
    } catch (error) {
        console.error("Erro ao adicionar item da balança:", error);
        alert("Erro ao adicionar produto ao carrinho!");
    }
}

// Funções do estoque
function carregarProdutos() {
    // Carregar produtos na tabela
    const tbody = document.getElementById("products-body");
    tbody.innerHTML = "";
    
    produtos.forEach((produto, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${produto.id}</td>
            <td>${produto.nome}</td>
            <td>R$ ${produto.preco.toFixed(2)}</td>
            <td>${produto.balanca ? "Por peso" : produto.estoque}</td>
            <td>${produto.categoria}</td>
            <td>
                <button onclick="editarProduto(${index})" class="btn-primary">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="excluirProduto(${index})" class="btn-danger">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Carregar produtos no select da balança
    const selectBalanca = document.getElementById("balanca-produto");
    selectBalanca.innerHTML = "";
    
    produtos.filter(p => p.balanca).forEach(produto => {
        const option = document.createElement("option");
        option.value = produto.id;
        option.textContent = produto.nome;
        selectBalanca.appendChild(option);
    });
}

function buscarProdutoEstoque() {
    const buscaInput = document.getElementById("estoque-search");
    const buscaRaw = buscaInput.value.trim();
    const busca = buscaRaw.toLowerCase();
    
    // Se a busca estiver vazia, mostrar mensagem para digitar
    if (busca === "") {
        const tbody = document.getElementById("products-body");
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #999; padding: 30px; font-style: italic;">
                    Digite o nome ou código do produto para pesquisar...
                </td>
            </tr>
        `;
        // Limpa o campo de busca mesmo ao exibir a mensagem
        buscaInput.value = "";
        return;
    }
    
    const produtosFiltrados = produtos.filter(p => 
        p.nome.toLowerCase().includes(busca) || 
        p.id.toLowerCase().includes(busca)
    );
    
    const tbody = document.getElementById("products-body");
    tbody.innerHTML = "";
    
    if (produtosFiltrados.length === 0) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td colspan="6" style="text-align: center; color: #666; padding: 20px;">
                Nenhum produto encontrado para "${buscaRaw}"
            </td>
        `;
        tbody.appendChild(tr);
        // Limpa o campo de busca quando não há resultados
        buscaInput.value = "";
        return;
    }
    
    produtosFiltrados.forEach((produto, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${produto.id}</td>
            <td>${produto.nome}</td>
            <td>R$ ${produto.preco.toFixed(2)}</td>
            <td>${produto.balanca ? "Por peso" : produto.estoque}</td>
            <td>${produto.categoria}</td>
            <td>
                <button onclick="editarProduto(${produtos.indexOf(produto)})" class="btn-primary">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="excluirProduto(${produtos.indexOf(produto)})" class="btn-danger">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Limpar o campo de busca após concluir a pesquisa
    buscaInput.value = "";
}

function editarProduto(index) {
    const produto = produtos[index];
    
    document.getElementById("produto-modal-title").textContent = "Editar Produto";
    document.getElementById("produto-id").value = index;
    document.getElementById("produto-codigo").value = produto.id;
    document.getElementById("produto-nome").value = produto.nome;
    document.getElementById("produto-preco").value = produto.preco;
    document.getElementById("produto-estoque").value = produto.estoque;
    document.getElementById("produto-categoria").value = produto.categoria;
    document.getElementById("produto-balanca").checked = produto.balanca;
    
    mostrarModal("produto-modal");
}


function excluirProduto(index) {
    if (confirm("Deseja realmente excluir este produto?")) {
        produtos.splice(index, 1);
        salvarDadosAutomaticamente("produtos", produtos);
        carregarProdutos();
    }
}

// Funções de relatórios
function carregarVendas() {
    const tbody = document.getElementById("vendas-body");
    tbody.innerHTML = "";
    
    // Ordenar vendas por data (mais recentes primeiro)
    const vendasOrdenadas = [...vendas].sort((a, b) => new Date(b.data) - new Date(a.data));
    
    vendasOrdenadas.forEach((venda, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${venda.id}</td>
            <td>${new Date(venda.data).toLocaleString()}</td>
            <td>R$ ${venda.total.toFixed(2)}</td>
            <td>${formatarMetodoPagamento(venda.pagamento)}</td>
            <td>
                <button onclick="verDetalhesVenda(${vendas.indexOf(venda)})" class="btn-primary">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    atualizarResumoVendas(vendas);
}

function formatarMetodoPagamento(metodo) {
    switch(metodo) {
        case "dinheiro": return "Dinheiro";
        case "cartao-debito": return "Cartão de Débito";
        case "cartao-credito": return "Cartão de Crédito";
        case "pix": return "PIX";
        default: return metodo;
    }
};

function filtrarRelatorios() {
    const dataInicio = document.getElementById("date-start").value;
    const dataFim = document.getElementById("date-end").value;
    
    if (!dataInicio || !dataFim) {
        alert("Selecione as datas para filtrar!");
        return;
    }
    
    const inicio = new Date(dataInicio);
    inicio.setHours(0, 0, 0, 0);
    
    //const fim = new Date(dataFim);
    fim.setHours(23, 59, 59, 999);
    
    const vendasFiltradas = vendas.filter(venda => {
        const dataVenda = new Date(venda.data);
        return dataVenda >= inicio && dataVenda <= fim;
    });
    
    const tbody = document.getElementById("vendas-body");
    tbody.innerHTML = "";
    
    vendasFiltradas.forEach((venda, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${venda.id}</td>
            <td>${new Date(venda.data).toLocaleString()}</td>
            <td>R$ ${venda.total.toFixed(2)}</td>
            <td>${formatarMetodoPagamento(venda.pagamento)}</td>
            <td>
                <button onclick="verDetalhesVenda(${vendas.indexOf(venda)})" class="btn-primary">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    atualizarResumoVendas(vendasFiltradas);
}

function atualizarResumoVendas(listaVendas) {
    const totalVendas = listaVendas.reduce((soma, venda) => soma + venda.total, 0);
    const qtdVendas = listaVendas.length;
    const ticketMedio = qtdVendas > 0 ? totalVendas / qtdVendas : 0;
    
    document.getElementById("total-vendas").textContent = `R$ ${totalVendas.toFixed(2)}`;
    document.getElementById("qtd-vendas").textContent = qtdVendas;
    document.getElementById("ticket-medio").textContent = `R$ ${ticketMedio.toFixed(2)}`;
}

function verDetalhesVenda(index) {
    const venda = vendas[index];
    let detalhes = `Venda #${venda.id}\n`;
    detalhes += `Data: ${new Date(venda.data).toLocaleString()}\n`;
    detalhes += `Método de Pagamento: ${formatarMetodoPagamento(venda.pagamento)}\n\n`;
    detalhes += "Itens:\n";
    
    venda.itens.forEach(item => {
        detalhes += `${item.nome} - Qtd: ${item.quantidade} - R$ ${item.subtotal.toFixed(2)}\n`;
    });
    
    detalhes += `\nTotal: R$ ${venda.total.toFixed(2)}`;
    
    document.getElementById("detalhes-venda-text").textContent = detalhes;
    document.getElementById("detalhes-venda-modal").style.display = "block";
}

function fecharModalDetalhes() {
    document.getElementById("detalhes-venda-modal").style.display = "none";
}

// Fechar modal clicando fora
window.onclick = function (event) {
    const modal = document.getElementById("detalhes-venda-modal");
    if (event.target == modal) {
        modal.style.display = "none";
    }
};

// Funções de configuração
function carregarConfiguracoes() {
    document.getElementById("printer-model").value = configSistema.impressora.modelo;
    document.getElementById("printer-port").value = configSistema.impressora.porta;
    document.getElementById("balanca-model").value = configSistema.balanca.modelo;
    document.getElementById("balanca-port").value = configSistema.balanca.porta;
    document.getElementById("balanca-port-alt").value = configSistema.balanca.portaAlternativa || "COM4";
    document.getElementById("balanca-baudrate").value = configSistema.balanca.baudRate || 4800;
    const chkSimulado = document.getElementById("balanca-simulado");
    if (chkSimulado) chkSimulado.checked = !!configSistema.balanca.simulado;
    document.getElementById("empresa-nome").value = configSistema.empresa.nome;
    document.getElementById("empresa-cnpj").value = configSistema.empresa.cnpj;
    document.getElementById("empresa-endereco").value = configSistema.empresa.endereco;

    atualizarIndicadorSimulador();
}

function salvarConfiguracoes() {
    configSistema = {
        impressora: {
            modelo: document.getElementById("printer-model").value,
            porta: document.getElementById("printer-port").value
        },
        balanca: {
            modelo: document.getElementById("balanca-model").value,
            porta: document.getElementById("balanca-port").value,
            portaAlternativa: document.getElementById("balanca-port-alt").value,
            baudRate: parseInt(document.getElementById("balanca-baudrate").value),
            protocolo: "toledo_standard",
            simulado: !!document.getElementById("balanca-simulado")?.checked
        },
        empresa: {
            nome: document.getElementById("empresa-nome").value,
            cnpj: document.getElementById("empresa-cnpj").value,
            endereco: document.getElementById("empresa-endereco").value
        }
    };
    
    salvarDadosAutomaticamente("configSistema", configSistema);
    alert("Configurações da balança Toledo Prix 3 salvas com sucesso!\nPorta: " + configSistema.balanca.porta + "\nVelocidade: " + configSistema.balanca.baudRate + " bps");

    atualizarIndicadorSimulador();
}

function atualizarIndicadorSimulador() {
    const indicador = document.getElementById("balanca-simulador-indicador");
    if (!indicador) return;
    const ativo = !!configSistema?.balanca?.simulado;
    if (ativo) {
        indicador.textContent = "Simulador ativo: pesos gerados automaticamente.";
        indicador.style.color = "#2e7d32";
    } else {
        indicador.textContent = "Leitura real (COM): simulação temporária no ambiente web.";
        indicador.style.color = "#6a1b9a";
    }
}

// Função de impressão
function imprimirCupom(venda) {
    console.log("Imprimindo cupom da venda:", venda.id);
    
    // Mostrar recibo na tela
    const recibo = document.getElementById("recibo");
    
    // Atualizar data e hora
    document.getElementById("data-hora").textContent = new Date().toLocaleString();
    
    // Criar conteúdo do recibo com os itens da venda
    let itensHTML = "";
    venda.itens.forEach(item => {
        itensHTML += `<p>${item.nome} - R$ ${item.subtotal.toFixed(2)}</p>`;
    });
    
    // Substituir o conteúdo de exemplo pelo conteúdo real
    recibo.innerHTML = `
        <h1>Recibo</h1>
        <p>Mercadinho Morezine</p>
        <p>${configSistema.empresa.endereco || "Endereço não configurado"}</p>
        <p>Data: <span id="data-hora">${new Date().toLocaleString()}</span></p>
        <hr>
        <p>--------------------------</p>
        ${itensHTML}
        <hr>
        <p>---------------------------</p>
        <strong>Total: R$ ${venda.total.toFixed(2)}</strong>
        <p>Forma de pagamento: ${venda.formaPagamento}</p>
        <p>Volte sempre! 😊</p>
    `;
    
    // Mostrar o recibo em uma janela de impressão compacta
    const janelaImpressao = window.open('', '_blank', 'width=300,height=500');
    janelaImpressao.document.write('<html><head><title>Recibo de Compra</title>');
    janelaImpressao.document.write('<style>');
    janelaImpressao.document.write('body { font-family: monospace; font-size: 12px; width: 270px; margin: 0 auto; padding: 10px; }');
    janelaImpressao.document.write('h1 { text-align: center; font-size: 16px; }');
    janelaImpressao.document.write('p { margin: 3px 0; }');
    janelaImpressao.document.write('@media print { @page { size: 80mm auto; margin: 0; } body { width: 100%; } }');
    janelaImpressao.document.write('</style>');
    janelaImpressao.document.write('</head><body>');
    janelaImpressao.document.write(recibo.innerHTML);
    janelaImpressao.document.write('</body></html>');
    janelaImpressao.document.close();
    
    // Imprimir automaticamente após carregar
    janelaImpressao.onload = function() {
        janelaImpressao.focus();
        janelaImpressao.print();
        setTimeout(function() { janelaImpressao.close(); }, 1000);
    };
}