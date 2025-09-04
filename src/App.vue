<script setup>
import { ref, computed } from "vue";
import html2canvas from "html2canvas-pro";
window.html2canvas = html2canvas;
import MarkdownIt from "markdown-it";
import jsPDF from "jspdf";
import { Codemirror } from "vue-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";

const extensions = [markdown(), oneDark];
const md = new MarkdownIt();

const markdownText = ref(`# Hello Markdown !
- Ceci est une liste
- **Texte en gras**
- _Italique_`);

// HTML rendu depuis le texte Markdown
const renderedHtml = computed(() => md.render(markdownText.value));
// Référence à la div de preview (pour exporter en PDF)
const previewRef = ref(null);

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
		width: 550,
		windowWidth: 800
	});
};
</script>

<template>
	<div class="drawer lg:drawer-open">
		<input id="my-drawer" type="checkbox" class="drawer-toggle" checked />

		<!-- Zone principale -->
		<div class="drawer-content flex flex-col">
			<!-- NAVBAR -->
			<div class="navbar bg-base-100 shadow">
				<div class="flex-1 px-1">
					<div class="drawer-content">
						<label for="my-drawer" class="btn btn-ghost drawer-button lg:hidden" style="font-size: 18px; width: 40px;">
							<font-awesome-icon icon="fa-solid fa-bars-staggered" />
						</label>

						<h1 class="hidden lg:flex text-2xl font-semibold">
							Markkk !
						</h1>
					</div>
				</div>
				<div class="flex-none">
					<!-- <ul class="menu menu-horizontal px-1">
						<li><a></a></li>
					</ul> -->
					<img class="h-8 lg:hidden" src="/img/Markkk.svg" alt="Hadent logo">
				</div>
			</div>

			<!-- Contenu principal -->
			<div>
				<div class="editor-preview">
					<!-- Editeur Markdown -->
					<div class="editor relative">
						<codemirror
							v-model="markdownText"
							:extensions="extensions"
							placeholder="Écris ton Markdown ici..."
							style="height: 100%; font-size: 14px;"
						/>

						<div class="absolute bottom-3 right-3 flex flex-col gap-3">
							<div class="tooltip tooltip-left" data-tip="Sauvegarder">
								<button class="btn btn-lg btn-circle btn-neutral">
									<font-awesome-icon icon="fa-solid fa-floppy-disk" />
								</button>
							</div>
						</div>
					</div>

					<!-- Preview Markdown -->
					<div class="preview relative" ref="previewRef">
						<div class="pdf-content" v-html="renderedHtml"></div>

						<div class="absolute bottom-3 right-3 flex flex-col gap-3">
							<div class="tooltip tooltip-left" data-tip="Télécharger le PDF">
								<button @click="exportToPdf" class="btn btn-lg btn-circle btn-soft">
									<font-awesome-icon icon="fa-solid fa-download" />
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Sidebar -->
		<div class="drawer-side">
			<label for="my-drawer" class="drawer-overlay"></label>
            <div class="items-center justify-center pt-8 pb-4 bg-base-200 w-full hidden lg:flex">
				<img class="h-14" src="/img/Markkk.svg" alt="Hadent logo">
			</div>

			<ul class="menu p-4 w-64 min-h-full bg-base-200 text-base-content">
				<li>
					<a class="py-3 text-base">
						<font-awesome-icon icon="fa-solid fa-plus" />
						Nouveau
					</a>
				</li>
			</ul>
		</div>
	</div>
</template>