<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import html2canvas from "html2canvas-pro";
window.html2canvas = html2canvas;
import MarkdownIt from "markdown-it";
import jsPDF from "jspdf";
import { Codemirror } from "vue-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { saveDocument, getDocuments, deleteDocument, updateDocument, saveTheme, getTheme } from "@/utils/db";

const extensions = [markdown(), oneDark];
const md = new MarkdownIt();

const markdownText = ref('');
const documents = ref([]);
const modalRefs = reactive({});
const currentDoc = ref(null);
const renamingDocId = ref(null);
const renameInput = ref("");
const currentTheme = ref("dim");

// HTML rendu depuis le texte Markdown
const renderedHtml = computed(() => md.render(markdownText.value));

// Appliquer le thème à la balise html
const applyTheme = (theme) => {
  document.documentElement.setAttribute("data-theme", theme);
  currentTheme.value = theme;
};

// Gestion du changement de thème
const onThemeChange = async (event) => {
  const theme = event.target.value;
  applyTheme(theme);
  await saveTheme(theme);
};

// Charger tous les documents et le thème au montage
onMounted(async () => {
  loadDocuments();
  const savedTheme = await getTheme();
  applyTheme(savedTheme);
});

const loadDocuments = async () => {
  	documents.value = await getDocuments();
};

// Ouvrir une modal
const openModal = (id) => {
  	modalRefs[id]?.showModal();
};

// Fermer une modal
const closeModal = (id) => {
	const popover = document.getElementById(`popover-${id}`);
  	if (popover) popover.hidePopover();
  	modalRefs[id]?.close();
};

const removeDocument = async (id) => {
	closeModal(id);
	await deleteDocument(id);
	await loadDocuments(); // refresh la liste
};

// Sélectionner un document et charger son contenu
const selectDocument = (doc) => {
	currentDoc.value = doc;
	markdownText.value = doc.content;
};

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

// Sauvegarde dans IndexedDB
const saveToIndexedDB = async () => {
	if (!markdownText.value) return;
	if (currentDoc.value) {
		// Mise à jour du document existant
		const updatedDoc = {
			...currentDoc.value,
			content: markdownText.value,
			updatedAt: new Date().toISOString(),
		};
		await updateDocument(updatedDoc);
		currentDoc.value = updatedDoc;
	} else {
		// Création d'un nouveau document
		const doc = await saveDocument(markdownText.value);
		currentDoc.value = doc;
	}
	await loadDocuments();
};

// Créer un nouveau document : sauvegarde l'actuel puis vide l'éditeur
const newDocument = async () => {
	if (markdownText.value) {
		// Si un texte est présent, on sauvegarde ou met à jour
		if (currentDoc.value) {
			const updatedDoc = {
				...currentDoc.value,
				content: markdownText.value,
				updatedAt: new Date().toISOString(),
			};
			await updateDocument(updatedDoc);
			currentDoc.value = updatedDoc;
		} else {
			const doc = await saveDocument(markdownText.value);
			currentDoc.value = doc;
		}
		await loadDocuments();
	}
	// On vide l'éditeur et le doc courant
	currentDoc.value = null;
	markdownText.value = '';
};

const startRenaming = (doc) => {
	renamingDocId.value = doc.id;
	renameInput.value = doc.name;
};

const finishRenaming = async (doc) => {
	const newName = renameInput.value.trim();
	if (newName && newName !== doc.name) {
		const updatedDoc = { ...doc, name: newName, updatedAt: new Date().toISOString() };
		await updateDocument(updatedDoc);
		if (currentDoc.value && currentDoc.value.id === doc.id) {
		currentDoc.value = updatedDoc;
		}
		await loadDocuments();
	}
	renamingDocId.value = null;
	renameInput.value = "";
};

// Exporter toutes les données IndexedDB en JSON et les télécharger
const exportData = async () => {
	const allDocs = await getDocuments();
	const date = new Date();
	const yyyy = date.getFullYear();
	const mm = String(date.getMonth() + 1).padStart(2, '0');
	const dd = String(date.getDate()).padStart(2, '0');
	const fileName = `markkk_bdd_${yyyy}${mm}${dd}.json`;
	const blob = new Blob([JSON.stringify(allDocs, null, 2)], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = fileName;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
};

// Liste des thèmes disponibles
const themes = [
	"dim",
	"light",
	"bumblebee",
	"emerald",
	"corporate",
	"lofi",
	"winter",
	"sunset",
	"black",
	"forest",
	"synthwave",
	"lemonade",
	"caramellatte",
	"valentine",
	"aqua"
];
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
						<label for="my-drawer" class="btn btn-ghost btn-circle drawer-button lg:hidden text-base">
							<font-awesome-icon icon="fa-solid fa-bars-staggered" />
						</label>
						<div class="dropdown dropdown-start">
							<div tabindex="0" role="button" class="btn btn-ghost m-1 px-2 min-h-0 h-10 flex items-center gap-1">
								Theme
								<font-awesome-icon icon="fa-solid fa-angle-down" />
							</div>
							<ul tabindex="0" class="dropdown-content bg-base-300 rounded-box z-50 w-52 p-2 shadow-2xl absolute">
								<li v-for="theme in themes" :key="theme">
									<input
										type="radio"
										name="theme-dropdown"
										class="theme-controller btn btn-sm btn-block btn-ghost justify-start"
										:aria-label="theme.charAt(0).toUpperCase() + theme.slice(1)"
										:value="theme"
										@change="onThemeChange"
										:checked="currentTheme === theme"
									/>
								</li>
							</ul>
						</div>
					</div>
				</div>
				<div class="flex-none">
					<img class="h-10 lg:hidden px-1" src="/img/Markkk.svg" alt="Markkk logo">
					<h1 class="hidden lg:flex text-2xl px-1 font-semibold">
						Markkk !
					</h1>
				</div>
			</div>

			<!-- Contenu principal -->
			<div>
				<div class="editor-preview">
					<ul
						v-for="doc in documents"
						:key="doc.id"
						class="dropdown menu w-36 rounded-box bg-base-100 shadow-sm"
						popover
						:id="`popover-${doc.id}`"
						:style="`position-anchor:--anchor-${doc.id}`"
					>
						<li>
							<a @click="startRenaming(doc)">
								<font-awesome-icon icon="fa-solid fa-pencil" />
								Renommer
							</a>
						</li>

						<li>
							<a class="text-error" @click="openModal(doc.id)">
								<font-awesome-icon icon="fa-solid fa-trash-can" />
								Supprimer
							</a>
						</li>


						<!-- Modal avec ref dynamique -->
						<dialog
							class="modal"
							:ref="el => { if (el) modalRefs[doc.id] = el }"
						>
							<div class="modal-box">
								<h3 class="text-lg font-bold">Supprimer ce document ?</h3>
								<p class="py-4">
									Voulez-vous vraiment supprimer
									<span class="font-semibold">{{ doc.name }}</span> ?
								</p>
								<div class="modal-action">
									<!-- Bouton annuler -->
									<form method="dialog">
										<button class="btn btn-ghost">Annuler</button>
									</form>
									<!-- Bouton supprimer -->
									<button class="btn btn-soft btn-error" @click="removeDocument(doc.id)">
										Supprimer
									</button>
								</div>
							</div>
						</dialog>
					</ul>

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
								<button @click="saveToIndexedDB" class="btn btn-lg btn-circle btn-neutral">
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
								<button @click="exportToPdf" class="btn btn-lg btn-circle btn-neutral">
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
				<img class="h-14" src="/img/Markkk.svg" alt="Markkk logo">
			</div>

			<ul class="menu p-4 w-64 min-h-full bg-base-200 text-base-content">
				<li>
					<a class="py-2 text-base gap-1" @click="newDocument">
						<font-awesome-icon icon="fa-solid fa-plus" />
						Nouveau
					</a>
				</li>
				<li>
					<a class="py-2 text-base gap-1" @click="exportData">
						<font-awesome-icon icon="fa-regular fa-file-zipper" />
						Extraire mes données
					</a>
				</li>

				<div class="divider divider-start text-base-content/30">Documents</div>

				<li v-for="doc in documents" :key="doc.id" class="flex flex-row h-[36px] items-center justify-between">
					<div class="w-[86%] truncate">
						<template v-if="renamingDocId === doc.id">
							<input
								v-model="renameInput"
								class="input input-sm input-bordered w-full"
								@keyup.enter="finishRenaming(doc)"
								@blur="finishRenaming(doc)"
								:autofocus="true"
							/>
						</template>
						<template v-else>
							<a class="truncate block w-full" @click="selectDocument(doc)">
								{{ doc.name }}
							</a>
						</template>
					</div>
					<button
						@click.stop
						class="btn btn-xs btn-circle btn-ghost text-sm"
						:popovertarget="`popover-${doc.id}`"
						:style="`anchor-name:--anchor-${doc.id}`"
					>
						<font-awesome-icon icon="fa-solid fa-ellipsis" />
					</button>
				</li>

			</ul>
		</div>
	</div>
</template>