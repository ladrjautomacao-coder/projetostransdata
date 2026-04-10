

## Plano: Animação tecnológica na tela de login

### Conceito
Criar uma animação elaborada no painel esquerdo da tela de login onde:
1. As letras do logo "TRANSMOBILE" caem inclinadas para frente (rotação 3D no eixo X)
2. Um pequeno robô animado em SVG aparece e "levanta" as letras de volta à posição original
3. Ao finalizar, um efeito de brilho/luz pulsa ao redor do logo

Tudo feito com Framer Motion (já instalado no projeto) e CSS, sem dependências extras.

### Implementação

**1. Componente `LogoAnimation` (novo arquivo)**
- Separar o texto "TRANS" e "MOBILE" em spans individuais por letra
- Usar a imagem do logo real como referência visual, mas animar um texto estilizado que reproduza o logo
- Sequência de animação (~4s total):
  - **0-0.5s**: Letras aparecem caídas (rotateX: 80deg, opacity baixa)
  - **0.5-2s**: Robô SVG entra pela lateral e "empurra" as letras para cima
  - **2-3s**: Letras voltam à posição normal com spring bounce
  - **3-4s**: Efeito de glow/luz pulsa ao redor do logo (box-shadow animado + brilho radial)
- Após a animação, transicionar suavemente para a imagem real do logo

**2. Robô SVG inline**
- Robô minimalista e tecnológico desenhado em SVG (corpo retangular, antena, braços)
- Animado com Framer Motion: entra, levanta braços, sai

**3. Efeito de luz**
- `box-shadow` animado com cor primária (#e8781e)
- Gradiente radial pulsante ao fundo

**4. `src/pages/Login.tsx`**
- Substituir a animação simples do logo pelo novo componente `LogoAnimation`
- Manter o restante do painel esquerdo intacto

### Detalhes técnicos
- Rotação 3D com `perspective` CSS para efeito de profundidade
- `motion.span` por letra com `variants` e `staggerChildren`
- Robô como componente SVG com `motion.path` / `motion.rect`
- Glow via `animate` do Framer Motion em `boxShadow` e `filter`

### Arquivos
- Novo: `src/components/LogoAnimation.tsx`
- Editado: `src/pages/Login.tsx`

