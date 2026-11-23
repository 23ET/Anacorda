extends CharacterBody2D

var _speed = 5
var _turnSpeed = 0.05
var _stopDistance = 50 

func _physics_process(delta):
	var mousePosition = get_global_mouse_position()
	var toMouse = mousePosition - global_position
	var desiredDirection = toMouse.normalized()
	var currentDirection = Vector2(1, 0).rotated(rotation)
	var steering = currentDirection.lerp(desiredDirection, _turnSpeed * delta).normalized()
	rotation = steering.angle()
	
	if toMouse.length() > _stopDistance:
		velocity = steering * _speed
		move_and_collide(velocity)
	else:
		move_and_collide(Vector2.ZERO)

func _input(event):
	if event is InputEventMouseMotion:
		rotation = (event.position - global_position).angle()
