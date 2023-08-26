// ==UserScript==
// @name         LSS-VerbandsKH export
// @namespace    https://www.leitstellenspiel.de/
// @version      0.1alpha
// @description  Liest alle Verbands Krankenhäuser aus und exportiert sie als CSV-Datei.
// @match        https://www.leitstellenspiel.de/vehicles/*
// @author       MissSobol
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function showPopup(message) {
        const popup = document.createElement('div');
        popup.style.position = 'fixed';
        popup.style.bottom = '20px';
        popup.style.right = '20px';
        popup.style.zIndex = '9999';
        popup.style.padding = '10px';
        popup.style.background = 'rgba(0, 0, 0, 0.8)';
        popup.style.color = 'white';
        popup.style.borderRadius = '5px';
        popup.textContent = message;

        document.body.appendChild(popup);

        setTimeout(() => {
            popup.remove();
        }, 3000); // Remove popup after 3 seconds
    }

    function toggleButtonState(isLoading) {
        const button = document.getElementById('exportButton');
        if (isLoading) {
            button.style.backgroundColor = 'red';
            button.textContent = 'Daten werden gesammelt...';
            button.disabled = true;
        } else {
            button.style.backgroundColor = ''; // Reset to default color
            button.textContent = 'Daten als CSV exportieren';
            button.disabled = false;
        }
    }

    async function getBuildingData() {
        toggleButtonState(true); // Set button to loading state

        const table = document.getElementById('alliance-hospitals');
        if (!table) return;

        const buildings = table.querySelectorAll('tr');
        const buildingArray = Array.from(buildings);

        const csvData = [];

        for (const building of buildingArray) {
            const nameElement = building.querySelector('td:first-child');
            const idElement = building.querySelector('div[id^="div_free_beds_"]');
            const abgabeElement = building.querySelector('td:nth-child(4)');

            if (nameElement && idElement && abgabeElement) {
                const name = nameElement.textContent.trim();
                const id = idElement.id.replace('div_free_beds_', '');
                const abgabe = abgabeElement.textContent.trim();

                try {
                    const response = await fetch(`https://www.leitstellenspiel.de/buildings/${id}`);
                    const data = await response.text();
                    const parser = new DOMParser();
                    const htmlDoc = parser.parseFromString(data, 'text/html');
                    const ownerNameElement = htmlDoc.querySelector('a[href^="/profile/"]');
                    const ownerName = ownerNameElement ? ownerNameElement.textContent : 'Unknown';

                    csvData.push([name, abgabe, ownerName]);

                } catch (error) {
                    console.error('Error fetching owner data:', error);
                }
            }
        }

        const csvHeader = 'Gebäudename,Abgabe,Besitzername\n';
        const csvContent = csvData.map(createCsvRow).join('');

        const blob = new Blob([csvHeader, csvContent], { type: 'text/csv;charset=utf-8;' });
        const filename = 'building_data.csv';

        if (navigator.msSaveBlob) {
            navigator.msSaveBlob(blob, filename);
        } else {
            const link = document.createElement('a');
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }

        toggleButtonState(false); // Reset button to normal state
        showPopup('CSV-Datei wurde heruntergeladen!');
    }

    function createCsvRow(data) {
        return data.map(value => `"${value}"`).join(',') + '\n';
    }

    function createExportButton() {
        const button = document.createElement('button');
        button.textContent = 'Daten als CSV exportieren';
        button.id = 'exportButton'; // Assign an ID for styling and manipulation
        button.style.position = 'fixed';
        button.style.bottom = '20px';
        button.style.right = '20px';
        button.style.zIndex = '9999';

        button.addEventListener('click', getBuildingData);

        document.body.appendChild(button);
    }

    createExportButton();
})();
