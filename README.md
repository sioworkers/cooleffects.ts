# cooleffects.ts

## usage

```html
<script src="https://cdn.jsdelivr.net/gh/sioworkers/cooleffects.ts@deployments/hello.min.js"></script>
<script>
  hello.hello('sioworker');
</script>
```

or as a module:

```html
<script type="module">
  import { hello } from 'https://cdn.jsdelivr.net/gh/sioworkers/cooleffects.ts@deployments/hello.js';
  hello('sioworker');
</script>
```

## typewriter

```html
<span data-typewriter="hello|world" data-loop></span>
<script src="https://cdn.jsdelivr.net/gh/sioworkers/cooleffects.ts@deployments/typewriter.min.js"></script>
```

or `typewriter.typewriter('#title', { strings: ['hello', 'world'], loop: true })`.

options: `strings`, `speed`, `deleteSpeed`, `pause`, `loop`, `cursor`.

pin a build with `@deployments/builds/<build>/hello.min.js` ([builds](https://github.com/sioworkers/cooleffects.ts/tree/deployments/builds)).

## development

```sh
npm install
npm test
npm run build
```

## license

[Apache 2.0](LICENSE)
