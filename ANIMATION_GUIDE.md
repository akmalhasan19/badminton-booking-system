# Fluid "Reveal" Animation Guide

To reproduce the fluid "opening" effect for a mobile navbar, you need to combine **Layout Morphing** with **Staggered Content Orchestration**.

Here is the recipe used in this project:

## 1. The Morphing Container (`layout` prop)

The container must animate its geometry (width, height, border-radius) automatically when the state changes.

*   **The Component:** Use `<motion.nav>` or `<motion.div>`.
*   **The Prop:** Add the `layout` prop. This tells Framer Motion to automatically animate layout changes.
*   **The Styling:** Change classes based on state (`isOpen`).
    *   *Closed:* `h-[60px] rounded-full` (Pill shape)
    *   *Open:* `h-auto rounded-3xl` (Card shape)

```tsx
<motion.nav
  layout
  transition={{ type: "spring", stiffness: 200, damping: 25 }}
  className={isOpen ? "rounded-3xl" : "rounded-full h-[60px]"}
>
  {/* Content */}
</motion.nav>
```

## 2. The Sequence (Orchestration)

The key to the "opening" impression is timing. The container must expand *before* the links appear.

*   **Parent Variants:** Define a variant for the container that holds the links.
*   **delayChildren:** Wait for the container to start opening (e.g., 0.2s).
*   **staggerChildren:** Make links appear one by one (e.g., 0.1s apart).

```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.2,   // Wait for container to morph
      staggerChildren: 0.1  // Cascade effect
    }
  }
};
```

## 3. The Item Reveal (Slide + Blur)

To make the links feel like they are "materializing" inside the menu:

*   **Motion:** Slide them up (`y: 20` to `y: 0`).
*   **Blur:** Fade the blur out (`filter: "blur(5px)"` to `blur(0px)`).

```tsx
const itemVariants = {
  hidden: { y: 20, opacity: 0, filter: "blur(5px)" },
  visible: { y: 0, opacity: 1, filter: "blur(0px)" }
};
```

## 4. Implementation Structure

Wrap the content in `AnimatePresence` so it can exit gracefully when closed.

```tsx
<motion.nav layout ... >
  <AnimatePresence>
    {isOpen && (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {links.map(link => (
          <motion.a variants={itemVariants} ... >
            {link.name}
          </motion.a>
        ))}
      </motion.div>
    )}
  </AnimatePresence>
</motion.nav>
```
