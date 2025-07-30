import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import './FileUpload.css';

const FileUpload = ({ onFileUpload, file }) => {
    const [internalFile, setInternalFile] = useState(file || null);
    const [error, setError] = useState(null);

    // Sincroniza o estado interno com a prop file
    useEffect(() => {
        setInternalFile(file || null);
    }, [file]);

    const onDrop = useCallback((acceptedFiles) => {
        setError(null);
        
        // Check if any files were dropped
        if (!acceptedFiles || acceptedFiles.length === 0) {
            setError('Nenhum arquivo foi selecionado.');
            return;
        }

        const uploadedFile = acceptedFiles[0];
        if (!uploadedFile) {
            setError('Erro ao processar o arquivo.');
            return;
        }

        // Validar tipo do arquivo
        const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
        if (!validTypes.includes(uploadedFile.type)) {
            setError('Tipo de arquivo não suportado. Por favor, envie um arquivo PDF, DOC, DOCX ou TXT.');
            return;
        }

        // Validar tamanho do arquivo (20MB)
        const maxSize = 20 * 1024 * 1024; // 20MB em bytes
        if (uploadedFile.size > maxSize) {
            setError('O arquivo é muito grande. O tamanho máximo permitido é 20MB.');
            return;
        }

        setInternalFile(uploadedFile);
        onFileUpload(uploadedFile); // Passa o arquivo diretamente para o componente pai
    }, [onFileUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/plain': ['.txt']
        },
        maxFiles: 1
    });

    const removeFile = () => {
        setInternalFile(null);
        setError(null);
        onFileUpload(null); // Notifica o componente pai que o arquivo foi removido
    };

    return (
        <div className="file-upload-container">
            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                <input {...getInputProps()} />
                {internalFile ? (
                    <div className="file-info">
                        <p>Arquivo selecionado: {internalFile.name}</p>
                        <button onClick={e => { e.stopPropagation(); removeFile(); }} className="remove-button">
                            Remover arquivo
                        </button>
                    </div>
                ) : (
                    <p>Arraste um arquivo ou clique para selecionar</p>
                )}
            </div>
            {error && <p className="error-message">{error}</p>}
        </div>
    );
};

export default FileUpload; 