<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import html2canvas from "html2canvas-pro";
window.html2canvas = html2canvas;
import MarkdownIt from "markdown-it";
import jsPDF from "jspdf";
import { Codemirror } from "vue-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { saveDocument, getDocuments, deleteDocument, updateDocument } from "@/utils/db";

const extensions = [markdown(), oneDark];
const md = new MarkdownIt();

const markdownText = ref('');
const documents = ref([]);
const modalRefs = reactive({});
const currentDoc = ref(null);

// HTML rendu depuis le texte Markdown
const renderedHtml = computed(() => md.render(markdownText.value));

// Charger tous les documents au montage
onMounted(async () => {
	loadDocuments();
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
					</div>
				</div>
				<div class="flex-none">
					<!-- <ul class="menu menu-horizontal px-1">
						<li><a></a></li>
					</ul> -->
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
							<a>
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

				<div class="divider divider-start text-grey">Documents</div>

				<li v-for="doc in documents" :key="doc.id" class="flex flex-row h-[36px] items-center justify-between">
					<a class="w-[86%] truncate" @click="selectDocument(doc)">
						{{ doc.name }}
					</a>
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