/**
 * Service Gotenberg — Conversion HTML → PDF via l'API Gotenberg.
 *
 * Utilise l'endpoint /forms/chromium/convert/html pour envoyer
 * un document HTML complet et recevoir un PDF en réponse.
 *
 * En développement, les requêtes passent par le proxy Vite (/gotenberg)
 * pour contourner les restrictions CORS du navigateur.
 */

const GOTENBERG_BASE_URL = import.meta.env.DEV
	? "/gotenberg"
	: "https://demo.gotenberg.dev";

/**
 * Convertit du contenu HTML + CSS en PDF via Gotenberg et déclenche le téléchargement.
 *
 * @param {string} htmlContent  — Le HTML rendu du Markdown (contenu du <body>)
 * @param {string} cssContent   — Le CSS brut pour le style du PDF (pdf.css)
 * @param {string} filename     — Le nom du fichier PDF (sans extension)
 */
export async function convertHtmlToPdf(htmlContent, cssContent, filename = "document") {
	// 1. Construire un document HTML complet
	const fullHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${filename}</title>
	<style>
		${cssContent}
	</style>
</head>
<body>
	<div class="pdf-content">
		${htmlContent}
	</div>
</body>
</html>`;

	// 2. Créer le FormData avec le fichier index.html
	const formData = new FormData();
	const htmlBlob = new Blob([fullHtml], { type: "text/html" });
	formData.append("files", htmlBlob, "index.html");

	// 3. Appel API Gotenberg
	const response = await fetch(
		`${GOTENBERG_BASE_URL}/forms/chromium/convert/html`,
		{
			method: "POST",
			body: formData,
		}
	);

	if (!response.ok) {
		const errorText = await response.text().catch(() => "Erreur inconnue");
		throw new Error(
			`Gotenberg a retourné une erreur ${response.status}: ${errorText}`
		);
	}

	// 4. Récupérer le PDF et déclencher le téléchargement
	const pdfBlob = await response.blob();
	const url = URL.createObjectURL(pdfBlob);

	const a = document.createElement("a");
	a.href = url;
	a.download = `${filename}.pdf`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);

	URL.revokeObjectURL(url);
}
