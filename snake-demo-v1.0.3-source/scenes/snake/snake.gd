extends Node2D

const _bodyPartScene = preload("res://scenes/snake/body/body.tscn")
const _tailPartScene = preload("res://scenes/snake/tail/tail.tscn")
const _narrowPartScene = preload("res://scenes/snake/narrow/narrow.tscn")
const _bodyDistance = 10
const _bodyPartCount = 25

var _scaleY = 0.8
var _bodyParts = []
var _positionsHistory = []
var _movementHistory = _bodyPartCount * 10

func _ready():
	CreateSnakeParts()

# We add parts in reverse order
func CreateSnakeParts():
	AddTailParts()
	
	var adjustForTailParts = 2
	for i in range(_bodyPartCount - adjustForTailParts):
		AddBodyPart()
		
func _physics_process(_delta):
	# Adds a positionHistory to the end of the stack
	_positionsHistory.push_back({pos = %Head.position, rot = %Head.rotation})
	
	if _positionsHistory.size() > _movementHistory:
		# Removes the positionHistory from the top of the stack
		_positionsHistory.pop_front()

	UpdateBodyParts()

func AddTailParts():
	var tailPart = _tailPartScene.instantiate()
	%BodyPartContainer.add_child(tailPart)
	_bodyParts.append(tailPart)
	tailPart.scale = Vector2(1, _scaleY)
	
	var narrowPart = _narrowPartScene.instantiate()
	%BodyPartContainer.add_child(narrowPart)
	_bodyParts.append(narrowPart)
	narrowPart.scale = Vector2(1, _scaleY)

# Reminder: Body parts hidden by default. Goto
# body scene and make visible to see different start.
func AddBodyPart():
	var bodyPart = _bodyPartScene.instantiate()
	%BodyPartContainer.add_child(bodyPart)
	_bodyParts.append(bodyPart)
	bodyPart.scale = Vector2(1, _scaleY)
	_scaleY += 0.01
	if _scaleY > 1.0:
		_scaleY = 1.0

func UpdateBodyParts():
	var historyIndex = 0
	for bodyPart in _bodyParts:
		if historyIndex < _positionsHistory.size():
			var historyPoint = _positionsHistory[historyIndex]
			bodyPart.position = historyPoint["pos"]
			bodyPart.rotation = historyPoint["rot"]
			historyIndex += _bodyDistance
			
			# For demo. Just hiding the body nodes until they move.
			# How you start depends on the game.
			bodyPart.visible = true

	historyIndex = min(historyIndex, _positionsHistory.size() - 1)
