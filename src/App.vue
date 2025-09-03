<script setup>
import { ref, computed } from "vue";
import MarkdownIt from "markdown-it";
import jsPDF from "jspdf";
import { Codemirror } from "vue-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";

const extensions = [markdown()];
const md = new MarkdownIt();

const markdownText = ref(`# Hello Markdown !
- Ceci est une liste
- **Texte en gras**
- _Italique_`);

// HTML rendu depuis le texte Markdown
const renderedHtml = computed(() => md.render(markdownText.value));

// Référence à la div de preview (pour exporter en PDF)
// const previewRef = ref(null);

// Fonction d'export PDF
const exportToPdf = () => {
	if (!markdownText.value) return;
	const doc = new jsPDF("p", "pt", "a4");
	doc.html(renderedHtml.value, {
		callback: function (doc) {
			doc.save("Markkk-export.pdf");
		},
		x: 20,
		y: 20,
		width: 550, // largeur max
		windowWidth: 800 // meilleure fidélité de rendu
	});
};
</script>

<template>
	<h1 class="title">Markkk</h1>

	<div class="editor-preview">
		<!-- Éditeur Markdown -->
		<div class="editor">
			<codemirror
				v-model="markdownText"
				:extensions="extensions"
				:theme="oneDark"
				placeholder="Écris ton Markdown ici..."
				style="height: 300px; border-radius: 0px; border: 1px solid #333; margin-bottom: 1rem;"
			/>
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

/* Le textarea est remplacé par CodeMirror, donc on peut retirer ce style */

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
