<script setup>
import { ref, reactive, computed, onMounted, nextTick, onUnmounted } from "vue";
import { toast } from 'vue3-toastify';
import html2canvas from "html2canvas-pro";
window.html2canvas = html2canvas;
import MarkdownIt from "markdown-it";
import { Codemirror } from "vue-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { saveDocument, getDocuments, getDocument, deleteDocument, updateDocument, saveTheme, getTheme } from "@/utils/db";
// import markdownStyles from "@/assets/css/markdown.css?raw";
import markdownStyles from "@/assets/css/pdf.css?raw";


const extensions = [markdown(), oneDark];
const md = new MarkdownIt({
	html: true,
  	linkify: true,
  	typographer: true
});

const markdownText = ref('');
const currentDoc = ref(null);
const documents = ref([]);
const modalRefs = reactive({});
const renamingDocId = ref(null);
const renameInput = ref("");
const renameInputRefs = reactive({});
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

// Ajout des raccourcis clavier
const saveShortcut = (e) => {
	// Ctrl+S / Cmd+S
	if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
		e.preventDefault();
		saveToIndexedDB();
	}
	// Ctrl+P / Cmd+P
	if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
		e.preventDefault();
		exportToPdf();
	}
	// Ctrl+D / Cmd+D
	if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
		e.preventDefault();
		newDocument();
	}
};

onMounted(async () => {
	loadDocuments();
	const savedTheme = await getTheme();
	applyTheme(savedTheme);
	window.addEventListener('keydown', saveShortcut);
});

onUnmounted(() => {
	window.removeEventListener('keydown', saveShortcut);
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
	modalRefs[id]?.close();
	const popover = document.getElementById(`popover-${id}`);
	if (popover) popover.hidePopover?.();
};

const removeDocument = async (id) => {
	closeModal(id);
	await deleteDocument(id);
	if (currentDoc?.value?.id === id) {
		currentDoc.value = null;
		markdownText.value = '';
	}
	await loadDocuments();
};

const selectDocument = async (doc) => {
	// 1. Si un document courant existe, on vérifie si le contenu a changé avant d'update
	if (currentDoc.value) {
		const dbDoc = await getDocument(currentDoc.value.id);
		if (dbDoc?.content !== markdownText.value) {
			const updatedDoc = {
				...currentDoc.value,
				content: markdownText.value,
				updatedAt: new Date().toISOString(),
			};
			await updateDocument(updatedDoc);
			currentDoc.value = updatedDoc;
		}
	} else if (markdownText.value) {
		// 2. Sinon, si du texte existe, on sauvegarde un nouveau doc
		const newDoc = await saveDocument(markdownText.value);
		currentDoc.value = newDoc;
	}

	await loadDocuments();
	// 3. Afficher le document sélectionné
	currentDoc.value = doc;
	markdownText.value = doc.content;
};

const printBrowser = () => {
	if (!markdownText.value) return;

	// Créer une iframe invisible
	const iframe = document.createElement('iframe');
	iframe.style.position = 'absolute';
	iframe.style.width = '0px';
	iframe.style.height = '0px';
	iframe.style.border = 'none';
	document.body.appendChild(iframe);

	const doc = iframe.contentWindow.document;

	// Écrire le contenu HTML de base
	doc.open();
	doc.write(`
		<html>
		<head>
			<title>${currentDoc.value?.name || 'Document sans titre'}</title>
			<style>
				${markdownStyles}
				@media print {
					@page {
						size: A4 portrait;
					}
					body {
						-webkit-print-color-adjust: exact;
					}
				}
			</style>
		</head>
		<body>
			<div class="pdf-content">
				${renderedHtml.value}
			</div>
		</body>
		</html>
	`);
	doc.close();

	// Attendre que le contenu soit chargé et les styles appliqués
	iframe.contentWindow.focus();
	setTimeout(() => {
		iframe.contentWindow.print();
		// Supprimer l'iframe après impression (ou annulation)
		// On met un délai suffisant pour que l'impression se lance
		setTimeout(() => {
			document.body.removeChild(iframe);
		}, 1000);
	}, 100);
};

// Sauvegarde dans IndexedDB
const saveToIndexedDB = async () => {
	console.log("saveToIndexedDB tic");
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

	toast("Sauvegardé !", {
		type: "success",
		theme: "colored",
		position: "bottom-left",
		hideProgressBar: true,
		autoClose: 2000,
	});
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

const startRenaming = async (doc) => {
	// Fermer le dropdown/popover si ouvert
	const popover = document.getElementById(`popover-${doc.id}`);
	if (popover) popover.hidePopover?.();

	renamingDocId.value = doc.id;
	renameInput.value = doc.name;
	await nextTick();
	if (renameInputRefs[doc.id]) {
		renameInputRefs[doc.id].focus();
	}
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
	const fileName = `Markkk_bdd_${yyyy}${mm}${dd}.json`;
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
		<input id="my-drawer" type="checkbox" class="drawer-toggle" />
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
					<svg class="h-10 lg:hidden px-1 text-base-content" viewBox="0 0 251 94" fill="none" xmlns="http://www.w3.org/2000/svg">
						<g clip-path="url(#clip0_2023_2)">
						<path d="M129.017 38.999L129.018 54V69L104 46.498L129.017 24V38.999ZM176.897 38.999L176.899 54V69L151.881 46.498L176.897 24V38.999ZM224.496 38.999H251.029V54H224.498V69L199.479 46.498L224.496 24V38.999Z" fill="currentColor"/>
						<path d="M52.8789 41.0088L67.7012 23H80.8271V71H66.3506V43.1904L53.2949 59.2939H52.1514L39.0605 43.1904V71H25V23H38.126L52.8789 41.0088Z" fill="currentColor"/>
						<path d="M122.018 8.50202L97.0013 31.0002V16.001L97 1.00047L97 -14L122.018 8.50202Z" fill="currentColor"/>
						<path d="M170.018 8.50202L145.001 31.0002V16.001L145 1.00047L145 -14L170.018 8.50202Z" fill="currentColor"/>
						<path d="M218.018 8.50202L193.001 31.0002V16.001L193 1.00047L193 -14L218.018 8.50202Z" fill="currentColor"/>
						<path d="M122.018 84.502L97.0013 107V92.001L97 77.0005L97 62L122.018 84.502Z" fill="currentColor"/>
						<path d="M170.018 84.502L145.001 107V92.001L145 77.0005L145 62L170.018 84.502Z" fill="currentColor"/>
						<path d="M218.018 84.502L193.001 107V92.001L193 77.0005L193 62L218.018 84.502Z" fill="currentColor"/>
						</g>
						<rect x="5" y="5" width="241" height="84" rx="5" stroke="currentColor" stroke-width="10"/>
						<defs>
						<clipPath id="clip0_2023_2">
						<rect width="251" height="94" rx="10" fill="white"/>
						</clipPath>
						</defs>
					</svg>

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
									<form method="dialog">
										<button class="btn btn-ghost" @click="closeModal(doc.id)">
											Annuler
										</button>
									</form>
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
							style="height: 100%; font-size: 14px; width: auto; overflow: hidden;"
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
								<button @click="printBrowser" class="btn btn-lg btn-circle btn-neutral">
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
			<ul class="menu p-4 w-64 bg-base-200 text-base-content min-h-screen">
				<div class="items-center justify-center pt-4 pb-6 bg-base-200 w-full hidden lg:flex">
					<svg class="h-14 text-base-content" viewBox="0 0 251 94" fill="none" xmlns="http://www.w3.org/2000/svg">
						<g clip-path="url(#clip0_2023_2)">
						<path d="M129.017 38.999L129.018 54V69L104 46.498L129.017 24V38.999ZM176.897 38.999L176.899 54V69L151.881 46.498L176.897 24V38.999ZM224.496 38.999H251.029V54H224.498V69L199.479 46.498L224.496 24V38.999Z" fill="currentColor"/>
						<path d="M52.8789 41.0088L67.7012 23H80.8271V71H66.3506V43.1904L53.2949 59.2939H52.1514L39.0605 43.1904V71H25V23H38.126L52.8789 41.0088Z" fill="currentColor"/>
						<path d="M122.018 8.50202L97.0013 31.0002V16.001L97 1.00047L97 -14L122.018 8.50202Z" fill="currentColor"/>
						<path d="M170.018 8.50202L145.001 31.0002V16.001L145 1.00047L145 -14L170.018 8.50202Z" fill="currentColor"/>
						<path d="M218.018 8.50202L193.001 31.0002V16.001L193 1.00047L193 -14L218.018 8.50202Z" fill="currentColor"/>
						<path d="M122.018 84.502L97.0013 107V92.001L97 77.0005L97 62L122.018 84.502Z" fill="currentColor"/>
						<path d="M170.018 84.502L145.001 107V92.001L145 77.0005L145 62L170.018 84.502Z" fill="currentColor"/>
						<path d="M218.018 84.502L193.001 107V92.001L193 77.0005L193 62L218.018 84.502Z" fill="currentColor"/>
						</g>
						<rect x="5" y="5" width="241" height="84" rx="5" stroke="currentColor" stroke-width="10"/>
						<defs>
						<clipPath id="clip0_2023_2">
						<rect width="251" height="94" rx="10" fill="white"/>
						</clipPath>
						</defs>
					</svg>
				</div>

				<li @click="newDocument">
					<a class="gap-2">
						<font-awesome-icon icon="fa-solid fa-plus" />
						Nouveau
					</a>
				</li>
				<li @click="exportData">
					<a class="gap-2">
						<font-awesome-icon icon="fa-regular fa-file-zipper" />
						Extraire mes données
					</a>
				</li>
				<li>
					<a class="gap-2">
						<!-- <font-awesome-icon icon="fa-solid fa-gear" /> -->
						<font-awesome-icon icon="fa-solid fa-screwdriver-wrench" />
						Paramètres
					</a>
				</li>

				<div class="divider divider-start text-base-content/30">Documents</div>

				<li v-for="doc in documents" :key="doc.id" class="flex flex-row h-[36px] items-center justify-between">
					<div class="w-[86%] truncate" @click="selectDocument(doc)">
						<template v-if="renamingDocId === doc.id">
							<input
								v-model="renameInput"
								class="input input-sm input-bordered w-full"
								@keyup.enter="finishRenaming(doc)"
								@blur="finishRenaming(doc)"
								:ref="el => { if (el) renameInputRefs[doc.id] = el }"
							/>
						</template>
						<template v-else>
							<a class="truncate block w-full">
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

