class P {
  constructor (a, b) {
    this.a = a
    this.b = b
    this.c = a + b
  }

  display () {
    console.log(this.a, ',', this.b, '::', this.c)
  }
}

class Q extends P {
  constructor (a, b) {
    super(a, b)
    const c = 4
    this.c = a * b
    console.log(c)
    console.log(this.c)
  }
}

const j = new Q(1, 2)
j.display()
