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

pin a build with `@deployments/builds/<build>/hello.min.js` ([builds](https://github.com/sioworkers/cooleffects.ts/tree/deployments/builds)).

## development

```sh
npm install
npm test
npm run build
```

## license

[Apache 2.0](LICENSE)
