from browser import document, html, window, timer
import random

def start_game():
    # Очищаем экран под игру
    document.body.innerHTML = ""
    container = html.DIV(style={"position":"fixed", "inset":"0", "background":"#70c5ce", "display":"flex", "flex-direction":"column", "align-items":"center", "justify-content":"center"})
    document <= container
    
    title = html.H1("FLAPPY PYTHON (BRYTHON)", style={"color":"white"})
    canvas = html.CANVAS(width=320, height=480, style={"border":"5px solid white", "background":"#70c5ce"})
    canvas.id = "flappy_canvas"
    btn = html.BUTTON("ВЫХОД", style={"margin-top":"10px"})
    btn.bind("click", lambda e: window.location.reload())
    
    container <= title
    container <= canvas
    
    ctx = canvas.getContext("2d")
    bird = {"x": 50, "y": 150, "v": 0, "g": 0.6}
    pipes = []
    
    def draw():
        # Фон
        ctx.fillStyle = "#70c5ce"
        ctx.fillRect(0, 0, 320, 480)
        
        # Птичка
        bird["v"] += bird["g"]
        bird["y"] += bird["v"]
        ctx.fillStyle = "yellow"
        ctx.fillRect(bird["x"], bird["y"], 20, 20)
        
        # Трубы и логика
        if random.random() < 0.02:
            pipes.append({"x": 320, "y": random.randint(50, 250)})
            
        for p in pipes[:]:
            p["x"] -= 3
            ctx.fillStyle = "green"
            ctx.fillRect(p["x"], 0, 40, p["y"])
            ctx.fillRect(p["x"], p["y"] + 120, 40, 480)
            if p["x"] < -40: pipes.remove(p)
            if bird["x"]+20 > p["x"] and bird["x"] < p["x"]+40 and (bird["y"] < p["y"] or bird["y"]+20 > p["y"]+120):
                window.location.reload()
        
        if bird["y"] > 480 or bird["y"] < 0: window.location.reload()

    def jump(e):
        bird["v"] = -8

    canvas.bind("click", jump)
    timer.set_interval(draw, 30)

start_game()
