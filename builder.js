// Strict mode for more secure code
'use strict';

// Standardized data structure for better ATS compatibility
let resumeData = {
    personalInfo: {
        fullName: "",
        jobTitle: "",
        phone: "",
        email: "",
        location: "",
        photo: null
    },
    summary: "",
    experiences: [],
    education: [],
    skills: [],
    languages: [],
    projects: [],
    certifications: []
};

// Initialization function
function initCVBuilder() {
    console.log('Initializing CV Builder...');
    
    // Variables for application state
    let userPhoto = null;
    
    // Mobile environment detection
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    if (isMobile) {
        document.body.classList.add('mobile-mode');
    }
    
    // Quill editor initialization
    let headerEditor;
    try {
        headerEditor = new Quill('#header-editor', {
            theme: 'snow',
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline'],
                    [{ 'header': [1, 2, 3, false] }],
                    [{ 'color': [] }, { 'background': [] }],
                    ['clean']
                ]
            },
            placeholder: 'Write your header...'
        });

        // Update structured data when editor changes
        headerEditor.on('text-change', function() {
            updateStructuredDataFromEditor();
            saveResume();
        });
    } catch (error) {
        console.error('Error initializing editor:', error);
        showToast('Editor initialization error', 'error');
        return;
    }
    
    // Sections configuration
    function setupSections() {
        const sectionItems = document.querySelectorAll('.section-item');
        
        sectionItems.forEach(item => {
            if (isMobile) {
                item.addEventListener('click', function() {
                    addSection(this.dataset.section);
                });
            } else {
                item.setAttribute('draggable', 'true');
                item.addEventListener('dragstart', function(e) {
                    e.dataTransfer.setData('text/plain', this.dataset.section);
                });
            }
        });
    }
    
    // Sortable initialization for CV sections
    function initSortable() {
        if (isMobile) return;
        
        try {
            new Sortable(document.getElementById('resumePaper'), {
                animation: 150,
                ghostClass: 'sortable-ghost',
                chosenClass: 'sortable-chosen',
                handle: '.section-header',
                onEnd: function() {
                    showToast('Sections reorganized');
                    saveResume();
                }
            });
        } catch (error) {
            console.error('SortableJS error:', error);
        }
    }
    
    // Event listeners setup
    function setupEventListeners() {
        // Save
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', function() {
                saveResume();
            });
        }
        
        // Export PDF
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', function() {
                exportToPDF();
            });
        }

        // Export JSON
        const exportATS = document.getElementById('exportATS');
        if (exportATS) {
            exportATS.addEventListener('click', function() {
                exportToATS();
            });
        }

        // Export Text
        const exportPlainText = document.getElementById('exportPlainText');
        if (exportPlainText) {
            exportPlainText.addEventListener('click', function() {
                exportToPlainText();
            });
        }
        
        // Reset
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', function() {
                resetResume();
            });
        }
        
        // Settings changes
        const fontFamily = document.getElementById('fontFamily');
        if (fontFamily) {
            fontFamily.addEventListener('change', function() {
                document.getElementById('resumePaper').style.fontFamily = this.value;
                saveResume();
            });
        }
        
        const fontSize = document.getElementById('fontSize');
        if (fontSize) {
            fontSize.addEventListener('change', function() {
                document.getElementById('resumePaper').style.fontSize = this.value;
                saveResume();
            });
        }
        
        // Photo upload setup
        setupPhotoUpload();

        // Structured fields setup
        setupStructuredFields();
    }

    // Structured fields configuration
    function setupStructuredFields() {
        const structuredFields = document.querySelectorAll('[data-field]');
        structuredFields.forEach(field => {
            field.addEventListener('input', function() {
                const fieldPath = this.dataset.field;
                const value = this.value;
                
                // Update structured data
                setNestedValue(resumeData, fieldPath, value);
                
                // Update visual editor
                updateEditorFromStructuredData();
                
                saveResume();
            });
        });
    }

    // Utility function to set a nested value in an object
    function setNestedValue(obj, path, value) {
        const parts = path.split('.');
        let current = obj;
        
        for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) {
                current[parts[i]] = {};
            }
            current = current[parts[i]];
        }
        
        current[parts[parts.length - 1]] = value;
    }

    // Update structured data from editor
    function updateStructuredDataFromEditor() {
        const headerContent = document.querySelector('.resume-section[data-type="header"] .section-content');
        if (headerContent) {
            const elements = headerContent.querySelectorAll('h1, h2, p');
            
            elements.forEach(el => {
                const text = el.textContent;
                if (el.tagName === 'H1') {
                    resumeData.personalInfo.fullName = text;
                    if (document.getElementById('fullName')) {
                        document.getElementById('fullName').value = text;
                    }
                } else if (el.tagName === 'H2') {
                    resumeData.personalInfo.jobTitle = text;
                    if (document.getElementById('jobTitle')) {
                        document.getElementById('jobTitle').value = text;
                    }
                } else if (text.includes('@')) {
                    resumeData.personalInfo.email = text.replace('Email', '').trim();
                    if (document.getElementById('email')) {
                        document.getElementById('email').value = resumeData.personalInfo.email;
                    }
                } else if (text.includes('+') || text.includes('0')) {
                    resumeData.personalInfo.phone = text.replace('Phone', '').trim();
                    if (document.getElementById('phone')) {
                        document.getElementById('phone').value = resumeData.personalInfo.phone;
                    }
                } else if (text.includes('Address') || text.includes('Location') || text.includes('City')) {
                    resumeData.personalInfo.location = text.replace('Address', '').replace('Location', '').trim();
                    if (document.getElementById('location')) {
                        document.getElementById('location').value = resumeData.personalInfo.location;
                    }
                }
            });
        }
    }

    // Update editor from structured data
    function updateEditorFromStructuredData() {
        const headerContent = document.querySelector('.resume-section[data-type="header"] .section-content');
        if (headerContent) {
            let html = `<h1>${resumeData.personalInfo.fullName || 'YOUR NAME'}</h1>`;
            html += `<h2>${resumeData.personalInfo.jobTitle || 'Professional Title'}</h2>`;
            
            if (resumeData.personalInfo.phone) {
                html += `<p><i class="fas fa-phone"></i> ${resumeData.personalInfo.phone}</p>`;
            } else {
                html += `<p><i class="fas fa-phone"></i> Phone</p>`;
            }
            
            if (resumeData.personalInfo.email) {
                html += `<p><i class="fas fa-envelope"></i> ${resumeData.personalInfo.email}</p>`;
            } else {
                html += `<p><i class="fas fa-envelope"></i> Email</p>`;
            }
            
            if (resumeData.personalInfo.location) {
                html += `<p><i class="fas fa-map-marker-alt"></i> ${resumeData.personalInfo.location}</p>`;
            } else {
                html += `<p><i class="fas fa-map-marker-alt"></i> Address</p>`;
            }
            
            headerEditor.root.innerHTML = html;
        }
    }
    
    // Photo upload configuration
    function setupPhotoUpload() {
        const photoUpload = document.getElementById('photoUpload');
        const uploadBtn = document.getElementById('uploadPhotoBtn');
        const removeBtn = document.getElementById('removePhotoBtn');
        
        if (!photoUpload || !uploadBtn || !removeBtn) return;
        
        uploadBtn.addEventListener('click', () => photoUpload.click());
        
        photoUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            // File type validation
            if (!file.type.startsWith('image/')) {
                showToast('Please select a valid image', 'error');
                return;
            }
            
            // File size validation (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showToast('Image must not exceed 5MB', 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                userPhoto = e.target.result;
                resumeData.personalInfo.photo = userPhoto;
                updatePhotoPreview();
                updateResumePhoto();
                saveResume();
                showToast('Photo added successfully');
            };
            
            reader.onerror = function() {
                showToast('File reading error', 'error');
            };
            
            reader.readAsDataURL(file);
        });
        
        removeBtn.addEventListener('click', function() {
            userPhoto = null;
            resumeData.personalInfo.photo = null;
            photoUpload.value = '';
            updatePhotoPreview();
            removeResumePhoto();
            saveResume();
            showToast('Photo removed');
        });
        
        // Initial preview setup
        updatePhotoPreview();
    }
    
    // Photo preview update
    function updatePhotoPreview() {
        const photoPreview = document.getElementById('photoPreview');
        const removeBtn = document.getElementById('removePhotoBtn');
        
        if (!photoPreview || !removeBtn) return;
        
        if (userPhoto) {
            photoPreview.innerHTML = '';
            const img = document.createElement('img');
            img.src = userPhoto;
            img.alt = 'Profile photo';
            photoPreview.appendChild(img);
            removeBtn.style.display = 'block';
        } else {
            photoPreview.innerHTML = '<div class="placeholder"><i class="fas fa-user"></i></div>';
            removeBtn.style.display = 'none';
        }
    }
    
    // Update photo in resume
    function updateResumePhoto() {
        let headerSection = document.querySelector('.resume-section[data-type="header"]');
        if (!headerSection) return;
        
        let existingPhoto = headerSection.querySelector('.profile-photo');
        if (existingPhoto) {
            existingPhoto.src = userPhoto;
        } else {
            const photoElement = document.createElement('img');
            photoElement.className = 'profile-photo';
            photoElement.src = userPhoto;
            photoElement.alt = 'Profile photo';
            
            const headerContent = headerSection.querySelector('.section-content');
            if (headerContent) {
                headerContent.insertBefore(photoElement, headerContent.firstChild);
            }
        }
    }
    
    // Remove photo from resume
    function removeResumePhoto() {
        const headerSection = document.querySelector('.resume-section[data-type="header"]');
        if (headerSection) {
            const existingPhoto = headerSection.querySelector('.profile-photo');
            if (existingPhoto) {
                existingPhoto.remove();
            }
        }
    }
    
    // Save resume to localStorage
    function saveResume() {
        try {
            const saveData = {
                structuredData: resumeData,
                html: document.getElementById('resumePaper').innerHTML,
                style: {
                    fontFamily: document.getElementById('fontFamily').value,
                    fontSize: document.getElementById('fontSize').value
                },
                quillContent: headerEditor.getContents(),
                userPhoto: userPhoto
            };
            
            localStorage.setItem('cvData', JSON.stringify(saveData));
            showToast('Resume saved successfully');
        } catch (error) {
            console.error('Save error:', error);
            showToast('Save error', 'error');
        }
    }
    
    // Load resume from localStorage
    function loadResume() {
        try {
            const savedData = localStorage.getItem('cvData');
            if (!savedData) return;
            
            const data = JSON.parse(savedData);
            const resumePaper = document.getElementById('resumePaper');
            
            if (!resumePaper) return;
            
            // Load structured data
            if (data.structuredData) {
                resumeData = data.structuredData;
                
                // Update form fields
                if (document.getElementById('fullName')) {
                    document.getElementById('fullName').value = resumeData.personalInfo.fullName || '';
                }
                if (document.getElementById('jobTitle')) {
                    document.getElementById('jobTitle').value = resumeData.personalInfo.jobTitle || '';
                }
                if (document.getElementById('email')) {
                    document.getElementById('email').value = resumeData.personalInfo.email || '';
                }
                if (document.getElementById('phone')) {
                    document.getElementById('phone').value = resumeData.personalInfo.phone || '';
                }
                if (document.getElementById('location')) {
                    document.getElementById('location').value = resumeData.personalInfo.location || '';
                }
            }
            
            if (data.html) {
                resumePaper.innerHTML = data.html;
            }
            
            if (data.style) {
                const fontFamily = document.getElementById('fontFamily');
                if (fontFamily && data.style.fontFamily) {
                    fontFamily.value = data.style.fontFamily;
                    resumePaper.style.fontFamily = data.style.fontFamily;
                }
                
                const fontSize = document.getElementById('fontSize');
                if (fontSize && data.style.fontSize) {
                    fontSize.value = data.style.fontSize;
                    resumePaper.style.fontSize = data.style.fontSize;
                }
            }
            
            if (data.quillContent) {
                headerEditor.setContents(data.quillContent);
            }
            
            if (data.userPhoto) {
                userPhoto = data.userPhoto;
                updatePhotoPreview();
                updateResumePhoto();
            }
            
        } catch (e) {
            console.error('Loading error:', e);
            showToast('Data loading error', 'error');
        }
    }
    
    // Reset resume
    function resetResume() {
        if (confirm('Are you sure you want to reset your resume? All data will be lost.')) {
            try {
                localStorage.removeItem('cvData');
                
                const defaultHTML = `
                    <div class="resume-section" data-type="header">
                        <div class="section-header">
                            <i class="fas fa-user"></i>
                            <h3>HEADER</h3>
                        </div>
                        <div class="section-content">
                            <div id="header-editor" class="rich-editor">
                                <h1>YOUR NAME</h1>
                                <h2>Professional Title</h2>
                                <p><i class="fas fa-phone"></i> Phone</p>
                                <p><i class="fas fa-envelope"></i> Email</p>
                                <p><i class="fas fa-map-marker-alt"></i> Address</p>
                            </div>
                        </div>
                    </div>
                `;
                
                document.getElementById('resumePaper').innerHTML = defaultHTML;
                headerEditor.root.innerHTML = `
                    <h1>YOUR NAME</h1>
                    <h2>Professional Title</h2>
                    <p><i class="fas fa-phone"></i> Phone</p>
                    <p><i class="fas fa-envelope"></i> Email</p>
                    <p><i class="fas fa-map-marker-alt"></i> Address</p>
                `;
                
                // Reset settings
                const fontFamily = document.getElementById('fontFamily');
                if (fontFamily) {
                    fontFamily.value = "'Poppins', sans-serif";
                    document.getElementById('resumePaper').style.fontFamily = "'Poppins', sans-serif";
                }
                
                const fontSize = document.getElementById('fontSize');
                if (fontSize) {
                    fontSize.value = "14px";
                    document.getElementById('resumePaper').style.fontSize = "14px";
                }
                
                // Reset photo
                userPhoto = null;
                resumeData = {
                    personalInfo: {
                        fullName: "",
                        jobTitle: "",
                        phone: "",
                        email: "",
                        location: "",
                        photo: null
                    },
                    summary: "",
                    experiences: [],
                    education: [],
                    skills: [],
                    languages: [],
                    projects: [],
                    certifications: []
                };
                
                // Reset structured fields
                if (document.getElementById('fullName')) document.getElementById('fullName').value = '';
                if (document.getElementById('jobTitle')) document.getElementById('jobTitle').value = '';
                if (document.getElementById('email')) document.getElementById('email').value = '';
                if (document.getElementById('phone')) document.getElementById('phone').value = '';
                if (document.getElementById('location')) document.getElementById('location').value = '';
                
                const photoUpload = document.getElementById('photoUpload');
                if (photoUpload) {
                    photoUpload.value = '';
                }
                updatePhotoPreview();
                removeResumePhoto();
                
                showToast('Resume reset successfully');
            } catch (error) {
                console.error('Reset error:', error);
                showToast('Reset error', 'error');
            }
        }
    }
    
    // Function to show toast notifications
    function showToast(message, type = 'success') {
        const toast = document.getElementById('toastNotification');
        const toastMessage = document.getElementById('toastMessage');
        
        if (!toast || !toastMessage) return;
        
        // Set color based on type
        if (type === 'error') {
            toast.style.background = '#FF6584';
        } else {
            toast.style.background = '#6C63FF';
        }
        
        toastMessage.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    // Function to export to PDF
    async function exportToPDF() {
        showToast('Creating PDF...');
        
        try {
            const { PDFDocument, rgb } = PDFLib;
            const pdfDoc = await PDFDocument.create();
            
            let page = pdfDoc.addPage([595, 842]);
            const { width, height } = page.getSize();
            const margin = 50;
            const contentWidth = width - (margin * 2);
            let y = height - margin;
            
            // Extract username from content
            const content = extractPDFContent();
            let userName = resumeData.personalInfo.fullName || "YOUR NAME";
            
            // Add username at the top LEFT
            page.drawText(userName.toUpperCase(), {
                x: margin,
                y: y,
                size: 22,
                color: rgb(0.2, 0.2, 0.4),
                font: await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold)
            });
            
            // Add photo if exists - at the top RIGHT
            if (userPhoto) {
                try {
                    const photoResponse = await fetch(userPhoto);
                    const photoBytes = await photoResponse.arrayBuffer();
                    let photoImage;
                    
                    if (userPhoto.startsWith('data:image/jpeg') || userPhoto.includes('jpeg') || userPhoto.includes('jpg')) {
                        photoImage = await pdfDoc.embedJpg(photoBytes);
                    } else {
                        photoImage = await pdfDoc.embedPng(photoBytes);
                    }
                    
                    // Photo size
                    const photoSize = 100;
                    const photoX = width - margin - photoSize;
                    
                    // Photo position aligned with name
                    const photoY = y - 65;
                    
                    // Draw image at top right
                    page.drawImage(photoImage, {
                        x: photoX,
                        y: photoY,
                        width: photoSize,
                        height: photoSize,
                    });
                    
                    // Draw border around photo
                    page.drawRectangle({
                        x: photoX,
                        y: photoY,
                        width: photoSize,
                        height: photoSize,
                        borderColor: rgb(0.8, 0.8, 0.8),
                        borderWidth: 1,
                    });
                    
                } catch (photoError) {
                    console.warn('PDF photo error:', photoError);
                }
            }
            
            y -= 30;
            
            // Add contact information
            const contactInfo = extractContactInfoForPDF();
            for (const info of contactInfo) {
                if (y < 100) break;
                
                page.drawText(info, {
                    x: margin,
                    y: y,
                    size: 11,
                    color: rgb(0.3, 0.3, 0.5),
                    font: await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica)
                });
                y -= 15;
            }
            
            y -= 20;
            
            // Add content sections
            if (content && Array.isArray(content)) {
                for (const section of content) {
                    if (section.title.toLowerCase().includes('header')) continue;
                    
                    if (y < 100) {
                        page = pdfDoc.addPage([595, 842]);
                        y = height - margin;
                    }
                    
                    page.drawText(section.title.toUpperCase() + ':', {
                        x: margin,
                        y: y,
                        size: 14,
                        color: rgb(0.2, 0.2, 0.4),
                        font: await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold)
                    });
                    y -= 20;
                    
                    page.drawLine({
                        start: { x: margin, y: y + 5 },
                        end: { x: margin + 100, y: y + 5 },
                        thickness: 2,
                        color: rgb(0.8, 0.8, 0.8),
                    });
                    y -= 15;
                    
                    for (const item of section.items) {
                        if (y < 70) {
                            page = pdfDoc.addPage([595, 842]);
                            y = height - margin;
                        }
                        
                        if (!item || item.trim() === "" || item.includes('---')) continue;
                        
                        const lines = wrapText(item, 10, contentWidth);
                        
                        for (const line of lines) {
                            if (y < 70) {
                                page = pdfDoc.addPage([595, 842]);
                                y = height - margin;
                            }
                            
                            page.drawText(line, {
                                x: margin + 5,
                                y: y,
                                size: 10,
                                color: rgb(0, 0, 0),
                                font: await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica)
                            });
                            y -= 12;
                        }
                        y -= 5;
                    }
                    
                    y -= 15;
                }
            }
            
            // Footer
            const lastPage = pdfDoc.getPages()[pdfDoc.getPageCount() - 1];
            lastPage.drawText(`Generated on ${new Date().toLocaleDateString('en-US')} - EleganceCV Pro`, {
                x: margin,
                y: 30,
                size: 9,
                color: rgb(0.5, 0.5, 0.5),
                font: await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaOblique)
            });
            
            // Save
            const pdfBytes = await pdfDoc.save();
            downloadPDF(pdfBytes, 'my-resume.pdf');
            showToast('PDF generated successfully!');
            
        } catch (error) {
            console.error('PDF error:', error);
            showToast('Error creating PDF: ' + error.message, 'error');
        }
    }
    
    function extractContactInfoForPDF() {
        const contactInfo = [];
        
        if (resumeData.personalInfo.phone) {
            contactInfo.push(`Phone: ${resumeData.personalInfo.phone}`);
        }
        if (resumeData.personalInfo.email) {
            contactInfo.push(`Email: ${resumeData.personalInfo.email}`);
        }
        if (resumeData.personalInfo.location) {
            contactInfo.push(`Location: ${resumeData.personalInfo.location}`);
        }
        
        return contactInfo;
    }
    
    function wrapText(text, fontSize, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];
        
        for (let i = 1; i < words.length; i++) {
            const testLine = currentLine + ' ' + words[i];
            const testWidth = testLine.length * (fontSize * 0.5);
            
            if (testWidth > maxWidth) {
                lines.push(currentLine);
                currentLine = words[i];
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine);
        
        return lines;
    }
    
    function downloadPDF(pdfBytes, filename) {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }
    
    function extractPDFContent() {
        const content = [];
        const sections = document.querySelectorAll('.resume-section');
        
        sections.forEach(section => {
            const sectionData = {
                title: section.querySelector('h3')?.textContent || 'Section',
                items: []
            };
            
            const textElements = section.querySelectorAll('h1, h2, h4, p, li');
            textElements.forEach(el => {
                const text = el.textContent.trim();
                if (text && !text.startsWith('<')) {
                    sectionData.items.push(text);
                }
            });
            
            if (sectionData.items.length > 0) {
                content.push(sectionData);
            }
        });
        
        return content;
    }
    
    // Function to export to ATS format
    function exportToATS() {
        showToast('Preparing ATS-compatible resume...');
        
        // Create a simplified version for ATS
        const atsData = {
            personalInfo: resumeData.personalInfo,
            summary: resumeData.summary,
            experiences: resumeData.experiences,
            education: resumeData.education,
            skills: resumeData.skills,
            languages: resumeData.languages,
            projects: resumeData.projects,
            certifications: resumeData.certifications
        };
        
        // Convert to JSON
        const jsonData = JSON.stringify(atsData, null, 2);
        
        // Download JSON file
        downloadFile(jsonData, 'resume-data.json', 'application/json');
        showToast('JSON data exported successfully!');
    }
    
    // Function to export to plain text
    function exportToPlainText() {
        showToast('Preparing text version...');
        
        let text = '';
        
        // Personal information
        text += `${resumeData.personalInfo.fullName || 'FULL NAME'}\n`;
        text += `${resumeData.personalInfo.jobTitle || 'Professional Title'}\n\n`;
        
        if (resumeData.personalInfo.phone) {
            text += `Phone: ${resumeData.personalInfo.phone}\n`;
        }
        if (resumeData.personalInfo.email) {
            text += `Email: ${resumeData.personalInfo.email}\n`;
        }
        if (resumeData.personalInfo.location) {
            text += `Location: ${resumeData.personalInfo.location}\n`;
        }
        text += '\n';
        
        // Summary
        if (resumeData.summary) {
            text += `SUMMARY\n`;
            text += `${resumeData.summary}\n\n`;
        }
        
        // Experience
        if (resumeData.experiences && resumeData.experiences.length > 0) {
            text += `WORK EXPERIENCE\n`;
            resumeData.experiences.forEach(exp => {
                text += `${exp.title || 'Position'} at ${exp.company || 'Company'}\n`;
                if (exp.startDate || exp.endDate) {
                    text += `${exp.startDate || 'Start Date'} - ${exp.endDate || 'End Date'}\n`;
                }
                if (exp.description) {
                    text += `${exp.description}\n`;
                }
                text += '\n';
            });
        }
        
        // Education
        if (resumeData.education && resumeData.education.length > 0) {
            text += `EDUCATION\n`;
            resumeData.education.forEach(edu => {
                text += `${edu.degree || 'Degree'} - ${edu.institution || 'Institution'}\n`;
                if (edu.graduationYear) {
                    text += `Graduated in ${edu.graduationYear}\n`;
                }
                if (edu.description) {
                    text += `${edu.description}\n`;
                }
                text += '\n';
            });
        }
        
        // Skills
        if (resumeData.skills && resumeData.skills.length > 0) {
            text += `SKILLS\n`;
            resumeData.skills.forEach(skill => {
                text += `- ${skill}\n`;
            });
            text += '\n';
        }
        
        // Download text file
        downloadFile(text, 'resume.txt', 'text/plain');
        showToast('Text version exported successfully!');
    }
    
    function downloadFile(content, fileName, contentType) {
        const blob = new Blob([content], { type: contentType });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }
    
    // Add a new section
    function addSection(type) {
        const sections = {
            header: `<div class="resume-section" data-type="header">
                        <div class="section-header">
                            <i class="fas fa-user"></i>
                            <h3>HEADER</h3>
                        </div>
                        <div class="section-content">
                            <div class="rich-editor">
                                <h1>YOUR NAME</h1>
                                <h2>Professional Title</h2>
                                <p><i class="fas fa-phone"></i> Phone</p>
                                <p><i class="fas fa-envelope"></i> Email</p>
                                <p><i class="fas fa-map-marker-alt"></i> Address</p>
                            </div>
                        </div>
                    </div>`,
            summary: `<div class="resume-section" data-type="summary">
                        <div class="section-header">
                            <i class="fas fa-file-alt"></i>
                            <h3>SUMMARY</h3>
                        </div>
                        <div class="section-content">
                            <div class="rich-editor">
                                <p>A professional summary highlighting your key skills and experiences.</p>
                            </div>
                        </div>
                    </div>`,
            experience: `<div class="resume-section" data-type="experience">
                            <div class="section-header">
                                <i class="fas fa-briefcase"></i>
                                <h3>WORK EXPERIENCE</h3>
                            </div>
                            <div class="section-content">
                                <div class="rich-editor">
                                    <h4>Position</h4>
                                    <p><strong>Company</strong> | Start Date - End Date</p>
                                    <ul>
                                        <li>Description of responsibilities</li>
                                        <li>Key achievements</li>
                                        <li>Technologies used</li>
                                    </ul>
                                </div>
                            </div>
                        </div>`,
            education: `<div class="resume-section" data-type="education">
                            <div class="section-header">
                                <i class="fas fa-graduation-cap"></i>
                                <h3>EDUCATION</h3>
                            </div>
                            <div class="section-content">
                                <div class="rich-editor">
                                    <h4>Degree</h4>
                                    <p><strong>Institution</strong> | Graduation Year</p>
                                    <p>Description of program or skills acquired</p>
                                </div>
                            </div>
                        </div>`,
            skills: `<div class="resume-section" data-type="skills">
                        <div class="section-header">
                            <i class="fas fa-code"></i>
                            <h3>SKILLS</h3>
                        </div>
                        <div class="section-content">
                            <div class="rich-editor">
                                <ul>
                                    <li>Skill 1</li>
                                    <li>Skill 2</li>
                                    <li>Skill 3</li>
                                </ul>
                            </div>
                        </div>
                    </div>`,
            languages: `<div class="resume-section" data-type="languages">
                            <div class="section-header">
                                <i class="fas fa-language"></i>
                                <h3>LANGUAGES</h3>
                            </div>
                            <div class="section-content">
                                <div class="rich-editor">
                                    <ul>
                                        <li>Language 1 - Level</li>
                                        <li>Language 2 - Level</li>
                                    </ul>
                                </div>
                            </div>
                        </div>`,
            projects: `<div class="resume-section" data-type="projects">
                        <div class="section-header">
                            <i class="fas fa-project-diagram"></i>
                            <h3>PROJECTS</h3>
                        </div>
                        <div class="section-content">
                            <div class="rich-editor">
                                <h4>Project Name</h4>
                                <p><strong>Date</strong></p>
                                <p>Project description and technologies used</p>
                                <p>Project link if available</p>
                            </div>
                        </div>
                    </div>`,
            certifications: `<div class="resume-section" data-type="certifications">
                                <div class="section-header">
                                    <i class="fas fa-certificate"></i>
                                    <h3>CERTIFICATIONS</h3>
                                </div>
                                <div class="section-content">
                                    <div class="rich-editor">
                                        <ul>
                                            <li>Certification 1 - Date</li>
                                            <li>Certification 2 - Date</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>`
        };
        
        if (sections[type]) {
            document.getElementById('resumePaper').insertAdjacentHTML('beforeend', sections[type]);
            saveResume();
            showToast(`Section ${type} added`);
        }
    }
    
    // Initialize everything
    try {
        setupSections();
        initSortable();
        setupEventListeners();
        loadResume();
    } catch (error) {
        console.error('Application initialization error:', error);
        showToast('Application initialization error', 'error');
    }
}

// Start application once DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCVBuilder);
} else {
    initCVBuilder();
}