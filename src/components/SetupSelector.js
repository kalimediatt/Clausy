import React from 'react';
import { useSetup } from '../contexts/SetupContext';
import './SetupSelector.css';

const SetupSelector = () => {
    const { selectedSetup, setSelectedSetup, setups } = useSetup();

    return (
        <div className="setup-selector">
            <h3>Selecione o Modo de Operação</h3>
            <div className="setup-cards">
                {setups.map((setup) => (
                    <div
                        key={setup.title}
                        className={`setup-card ${selectedSetup?.title === setup.title ? 'selected' : ''}`}
                        onClick={() => setSelectedSetup(setup)}
                    >
                        <h4>{setup.title}</h4>
                        <p className="when-to-use">{setup.when_to_use}</p>
                        {selectedSetup?.title === setup.title && (
                            <div className="selected-indicator">✓ Selecionado</div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SetupSelector; 