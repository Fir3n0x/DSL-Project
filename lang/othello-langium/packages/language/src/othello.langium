grammar OthelloDsl

entry Game:
    'game' name=ID '{'
        (config=Config)?
        board=Board
        players=Players
        initial=Initial
        position=Position
        rules=Rules
    '}'
;

Config:
    'config' '{'
        (settings+=ConfigSetting)*
    '}'
;

ConfigSetting:
    name=ID '=' value=ConfigValue
;

ConfigValue:
    INT | STRING | BOOLEAN | BoardSizeValue
;

BoardSizeValue:
    rows=INT 'x' columns=INT
;

Board:
    'board' rows=INT 'x' columns=INT 
;

Players:
    'players' '{'
        black=Player
        white=Player
    '}'
;

Player:
    color=('black' | 'white') name=ID
;

Initial:
    'initial' '{'
        cells+=CellAssign*
    '}'
;

CellAssign:
    'cell' position=Position '=' color=('black' | 'white')
;

Position:
    'position' '(' row=INT ',' column=INT ')'
;

Rules:
    'rules' '{'
        move=MoveRule
        end=EndRule
        scoring=ScoringRule
    '}'
;

MoveRule:
    'move' '{'
        'type' type=('placement' | 'pass')?
        'valid' 'if' condition=ConditionExpr
        'effect' effect=EffectExpr
    '}'
;

ConditionExpr:
    name='captures_in_any_direction' '(' 'r' ',' 'c' ')'
;

EffectExpr returns string:
    'flip_captured_stones' '(' 'r' ',' 'c' ')'
;

EndRule:
    'end' 'when' condition=ConditionExpr
;

ScoringRule returns string:
    'scoring' 'count_pieces_per_player'
;


hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;
terminal BOOLEAN: /true|false/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
