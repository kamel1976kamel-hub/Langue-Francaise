/**
 * =================================================================
 * TESTS DE RÉGRESSION — getActivityAnswerText
 * =================================================================
 * Vérifie que la lecture de la réponse d'une activité fonctionne
 * aussi bien pour un <textarea> (mode normal) que pour un <div>
 * contenant un tableau d'<input> (mode hasTable).
 *
 * Sans dépendance externe (jsdom etc.) — mock DOM minimal.
 * =================================================================
 */

let pass = 0, fail = 0;
function assert(cond, label) {
    if (cond) { pass++; console.log('  ✅ PASS — ' + label); }
    else { fail++; console.error('  ❌ ÉCHEC — ' + label); }
}
function assertEq(actual, expected, label) {
    const ok = actual === expected;
    if (ok) { pass++; console.log('  ✅ PASS — ' + label); }
    else { fail++; console.error('  ❌ ÉCHEC — ' + label + ' (attendu: ' + JSON.stringify(expected) + ', obtenu: ' + JSON.stringify(actual) + ')'); }
}

// ─── Mock DOM minimal ───
function makeElement(tag, id, attrs) {
    const el = {
        tagName: tag.toUpperCase(),
        id: id,
        value: (tag === 'textarea' || tag === 'input') ? (attrs && attrs.value || '') : undefined,
        children: [],
        querySelectorAll: function(selector) {
            // Utiliser this.children pour supporter l'affectation après création
            return (this.children || []).filter(function(c) {
                return c.tagName === 'INPUT' && c.getAttribute('type') === 'text';
            });
        },
        getAttribute: function(name) {
            return attrs && attrs[name] || null;
        }
    };
    return el;
}

function makeInput(type, value) {
    const el = makeElement('input', '', { type: type, value: value });
    return el;
}

function makeDoc(elementsById) {
    return {
        getElementById: function(id) {
            return elementsById[id] || null;
        }
    };
}

// ─── Réplique exacte de getActivityAnswerText (index.html) ───
function getActivityAnswerText(chapterId, activityId) {
    var el = document.getElementById('activity-answer-' + chapterId + '-' + activityId);
    if (!el) return '';
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
        return el.value.trim();
    }
    // Tableau : collecter les valeurs des <input> non vides
    var inputs = el.querySelectorAll('input[type="text"]');
    var parts = [];
    for (var i = 0; i < inputs.length; i++) {
        var v = inputs[i].value.trim();
        if (v) parts.push(v);
    }
    return parts.join(' ');
}

// ─── Tests ───
console.log('🧪 Tests de régression — getActivityAnswerText\n');

// TEST 1 : Textarea avec contenu
console.log('\n📋 Test 1 : Textarea avec contenu');
{
    const ta = makeElement('textarea', 'activity-answer-ch1-act2', { value: '  La texte est important  ' });
    global.document = makeDoc({ 'activity-answer-ch1-act2': ta });
    assertEq(getActivityAnswerText('ch1', 'act2'), 'La texte est important', 'Textarea : valeur trimmée correcte');
}

// TEST 2 : Textarea vide
console.log('\n📋 Test 2 : Textarea vide');
{
    const ta = makeElement('textarea', 'activity-answer-ch1-act3', { value: '   ' });
    global.document = makeDoc({ 'activity-answer-ch1-act3': ta });
    assertEq(getActivityAnswerText('ch1', 'act3'), '', 'Textarea vide : retourne chaîne vide');
}

// TEST 3 : Élément inexistant
console.log('\n📋 Test 3 : Élément inexistant');
{
    global.document = makeDoc({});
    assertEq(getActivityAnswerText('ch99', 'act99'), '', 'Élément absent : retourne chaîne vide');
}

// TEST 4 : DIV avec tableau — tous les inputs remplis
console.log('\n📋 Test 4 : DIV avec tableau (tous remplis)');
{
    const div = makeElement('div', 'activity-answer-ch4-act1');
    div.children = [
        makeInput('text', 'Le récit'),
        makeInput('text', 'raconter une histoire'),
        makeInput('text', 'divertir le lecteur')
    ];
    global.document = makeDoc({ 'activity-answer-ch4-act1': div });
    const result = getActivityAnswerText('ch4', 'act1');
    assertEq(result, 'Le récit raconter une histoire divertir le lecteur', 'Tableau : tous les inputs concaténés');
}

// TEST 5 : DIV avec tableau — inputs partiellement vides
console.log('\n📋 Test 5 : DIV avec tableau (partiellement vide)');
{
    const div = makeElement('div', 'activity-answer-ch4-act2');
    div.children = [
        makeInput('text', 'Le sujet'),
        makeInput('text', ''),
        makeInput('text', '   '),
        makeInput('text', 'indices trouvés')
    ];
    global.document = makeDoc({ 'activity-answer-ch4-act2': div });
    const result = getActivityAnswerText('ch4', 'act2');
    assertEq(result, 'Le sujet indices trouvés', 'Tableau : inputs vides ignorés');
}

// TEST 6 : DIV avec tableau — tous les inputs vides
console.log('\n📋 Test 6 : DIV avec tableau (tout vide)');
{
    const div = makeElement('div', 'activity-answer-ch5-act1');
    div.children = [
        makeInput('text', ''),
        makeInput('text', '  ')
    ];
    global.document = makeDoc({ 'activity-answer-ch5-act1': div });
    const result = getActivityAnswerText('ch5', 'act1');
    assertEq(result, '', 'Tableau vide : retourne chaîne vide');
}

// TEST 7 : DIV sans inputs (cas dégénéré)
console.log('\n📋 Test 7 : DIV sans inputs');
{
    const div = makeElement('div', 'activity-answer-ch5-act2');
    div.children = [];
    global.document = makeDoc({ 'activity-answer-ch5-act2': div });
    const result = getActivityAnswerText('ch5', 'act2');
    assertEq(result, '', 'DIV sans inputs : retourne chaîne vide');
}

// TEST 8 : Ancien bug — .value sur un DIV est undefined, pas crash
console.log('\n📋 Test 8 : Régression — pas de crash sur DIV (ancien bug)');
{
    const div = makeElement('div', 'activity-answer-ch6-act1');
    div.children = [makeInput('text', 'réponse élève')];
    global.document = makeDoc({ 'activity-answer-ch6-act1': div });
    let crashed = false;
    try {
        const result = getActivityAnswerText('ch6', 'act1');
        assert(result !== undefined, 'Résultat non undefined');
        assertEq(result, 'réponse élève', 'Valeur correcte depuis DIV/table');
    } catch (e) {
        crashed = true;
    }
    assert(!crashed, 'Pas de crash TypeError sur DIV (ancien bug .trim() sur undefined)');
}

// TEST 9 : Input direct (cas rare mais supporté)
console.log('\n📋 Test 9 : INPUT direct');
{
    const inp = makeElement('input', 'activity-answer-ch7-act1', { type: 'text', value: '  réponse directe  ' });
    global.document = makeDoc({ 'activity-answer-ch7-act1': inp });
    assertEq(getActivityAnswerText('ch7', 'act1'), 'réponse directe', 'INPUT direct : valeur trimmée');
}

// ─── Résumé ───
console.log('\n' + '='.repeat(60));
console.log('📊 Résultats : ' + pass + ' pass, ' + fail + ' échec(s)');
console.log('='.repeat(60));

process.exit(fail > 0 ? 1 : 0);
