# From Vanilla to Next.js: A Bridge Guide

If you've spent your life in `.html`, `.css`, and `.js` files, Next.js might look like "over-engineered magic." It's not! It's just a different way of organizing the same things. Here is how your knowledge maps to our project.

## 1. The Big Shift: Components, Not Pages
In Vanilla, you build **pages** (`about.html`, `contact.html`).
In Next.js, we build **Components** (small, reusable pieces of UI) and assemble them.

| Vanilla Concept | Next.js / React Concept |
| :--- | :--- |
| `index.html` | `app/layout.tsx` (The wrapper) and `app/page.tsx` (The content) |
| `<a href="/about.html">` | `<Link href="/about">` (Much faster!) |
| `<link rel="stylesheet">` | Tailwind classes directly on the elements |
| `<script src="app.js">` | `import { ... } from '...'` at the top of the file |

---

## 2. JSX: HTML inside JavaScript
In Vanilla, you usually keep HTML and JS separate. In React, we use **JSX**. It looks like HTML, but it lives inside your `.tsx` files.

**Vanilla Way:**
```javascript
// JS
const div = document.getElementById('myDiv');
div.innerHTML = '<h1>Hello</h1>';
```

**Next.js Way:**
```tsx
// This is just a function that returns HTML!
export default function MyComponent() {
  return (
    <div id="myDiv">
      <h1>Hello</h1>
    </div>
  );
}
```

---

## 3. "State" is the New `innerHTML`
In Vanilla, when you want to change text on a button click, you find the element and change its text. In React, you update **State**, and the UI updates automatically.

**Vanilla Way:**
```javascript
let count = 0;
button.onclick = () => {
  count++;
  display.innerText = count;
};
```

**Next.js Way (React Hook):**
```tsx
const [count, setCount] = useState(0);

return (
  <button onClick={() => setCount(count + 1)}>
    Count is {count}
  </button>
);
```

---

## 4. CSS: Meet Tailwind
We don't write many `.css` files. Instead, we use **Tailwind Utility Classes**. Instead of writing a CSS rule for `margin-top: 20px`, you just add the class `mt-5` to the element.

*   `class="bg-black text-white p-4"` = Black background, white text, padding of 1rem.
*   `class="rounded-full border-2 border-black"` = A round button with a thick black border.

---

## 5. Our Project Structure (Where to look)
If you want to change something:
*   **The Navbar/Topbar?** Look in `components/layout/Topbar.tsx`.
*   **The Main Dashboard?** Look in `app/(protected)/dashboard/page.tsx`.
*   **A Button Style?** Look in `components/shared/Button.tsx`.

## 6. How it loads (The Flow)
In a vanilla site, you open `index.html` in a browser. In Next.js:
1.  **The Server** runs the code first.
2.  **The Layout** (`app/layout.tsx`) sets up the shell (Head, Body, Fonts).
3.  **The Page** (`app/page.tsx`) fills in the content.
4.  **The Browser** takes over and makes it interactive.

## 7. Next Steps
1.  **Read the HTML-like parts**: Look at any file in the `app` folder and find the `return` statement.
2.  **Change a class**: Try changing a Tailwind class like `bg-blue-500` to `bg-red-500` and see the magic of Hot Module Replacement (the page updates without refreshing!).
3.  **Ask the AI**: If you see a weird symbol like `=>` or `{...}`, just ask "What is this doing in vanilla JS?" and it will explain.

Welcome to the team! You're going to love how fast we can build things here.
