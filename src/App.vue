<script setup>
import { ref, computed } from "vue";
import MarkdownIt from "markdown-it";
// import html2pdf from "html2pdf.js";
import jsPDF from "jspdf";

const markdownText = ref(`# Hello Markdown !
- Ceci est une liste
- **Texte en gras**
- _Italique_`);

const md = new MarkdownIt();

// HTML rendu depuis le texte Markdown
const renderedHtml = computed(() => md.render(markdownText.value));

// Référence à la div de preview (pour exporter en PDF)
const previewRef = ref(null);

// Fonction d'export PDF
const exportToPdf = () => {
if (!markdownText.value) return;

// const opt = {
//   margin: 0.5,
//   filename: "markdown-export.pdf",
//   image: { type: "jpeg", quality: 0.98 },
//   html2canvas: { scale: 2 },
//   jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
// };

// html2pdf().from(renderedHtml.value).set(opt).save();
const doc = new jsPDF("p", "pt", "a4");

doc.html(renderedHtml.value, {
	callback: function (doc) {
		doc.save("markdown-export.pdf");
	},
	x: 20,
	y: 20,
	width: 550, // largeur max
	windowWidth: 800 // meilleure fidélité de rendu
	});
};
</script>

<template>
	<h1 class="title">📝 Éditeur Markdown → PDF</h1>

	<div class="editor-preview">
		<!-- Éditeur Markdown -->
		<div class="editor">
			<textarea
			v-model="markdownText"
			placeholder="Écris ton Markdown ici..."
			></textarea>
		</div>

		<!-- Preview Markdown -->
		<div class="preview" ref="previewRef">
			<div class="pdf-content" v-html="renderedHtml"></div>
		</div>
	</div>

	<!-- Bouton Export -->
	<button @click="exportToPdf">📄 Exporter en PDF</button>
</template>

<style>
.app {
  max-width: 1000px;
  margin: auto;
  padding: 20px;
  font-family: sans-serif;
}

.title {
  text-align: center;
  margin-bottom: 20px;
}

.editor-preview {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.editor,
.preview {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.pdf-content {
  font-family: Arial, Helvetica, sans-serif;
}

textarea {
  flex: 1;
  padding: 10px;
  font-family: monospace;
  font-size: 14px;
  resize: vertical;
  min-height: 300px;
}

.preview div {
  border: 1px solid #ddd;
  padding: 10px;
  background: #fafafa;
  flex: 1;
  overflow-y: auto;
}
button {
  display: block;
  margin: auto;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}
</style>
