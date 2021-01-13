// ======================================================================================================================
// Regroupement de fonctions utiles
// ======================================================================================================================

pickRandomInt = function(intRange){
    return Math.floor(Math.random() * intRange);
}

cylinderIntersectsCylinder = function( ax, ay, az, ah, ar, bx, by, bz, bh, br ){
	var ah2 = ah / 2;
	var bh2 = bh / 2;

	var overlapY = Math.min( ay + ah2, by + bh2 ) - Math.max( ay - ah2, by - bh2 );
	if ( overlapY < 0 ) return false;

	var x = ax - bx;
	var z = az - bz;

	var distance = Math.hypot( x, z );
	if ( distance > ar + br ) return false;

	var overlapXZ = ar + br - distance;

	var minOverlap, y;

	if ( overlapY < overlapXZ ) {
		minOverlap = overlapY;

		y = Math.sign( ay - by );
		x = 0;
		z = 0;
	} else {
		minOverlap = overlapXZ;

		x /= distance;
		z /= distance;
		y = 0;
	}

	return {
		minOverlap: minOverlap,
		mtvX: x,
		mtvY: y,
		mtvZ: z,
	};
}

sphereIntersectsSphere = function( ax, ay, az, ar, bx, by, bz, br ){
	var x = ax - bx;
	var y = ay - by;
	var z = az - bz;

	var distance = Math.hypot( x, y, z );

	if ( distance > ar + br ) return false;

	var overlap = ar + br - distance;

	if ( distance > 0 ) {
		x /= distance;
		y /= distance;
		z /= distance;
	} 
	else {
		x = 1;
		y = 0;
		z = 0;
	}

	return {
		minOverlap: overlap,
		mtvX: x,
		mtvY: y,
		mtvZ: z,
	};
}

function sphereIntersectsCylinder( sx, sy, sz, sr, cx, cy, cz, ch, cr ) {

	var ch2 = ch / 2;
	var overlapY = Math.min( sy + sr, cy + ch2 ) - Math.max( sy - sr, cy - ch2 );
	if ( overlapY < 0 ) return false;

	var newRadius;
	var h1, h2;

	if ( overlapY < sr ) {
		h1 = sr - overlapY;
		newRadius = Math.sqrt( sr * sr - h1 * h1 );
	} else {
		newRadius = sr;
	}
	var x = sx - cx;
	var z = sz - cz;

	var distance = Math.hypot( x, z );
	if ( distance > newRadius + cr ) return false;

	var overlapXZ = newRadius + cr - distance;
	var minOverlap, y;

	if ( overlapY < overlapXZ ) {
		minOverlap = overlapY;
		y = Math.sign( sy - cy );
		x = 0;
		z = 0;
	} else if ( overlapY < sr ) {
		var newerRadius = newRadius - overlapXZ;

		h2 = Math.sqrt( sr * sr - newerRadius * newerRadius );
		minOverlap = h2 - h1;

		y = Math.sign( sy - cy );
		x = 0;
		z = 0;
	} else {
		minOverlap = overlapXZ;

		x /= distance;
		z /= distance;
		y = 0;
	}

	return {
		minOverlap: minOverlap,
		mtvX: x,
		mtvY: y,
		mtvZ: z,
	};
}

function cylinderIntersectsSphere( cx, cy, cz, ch, cr, sx, sy, sz, sr ) {

	var result = sphereIntersectsCylinder( sx, sy, sz, sr, cx, cy, cz, ch, cr );
	
	if ( result ) {
		result.mtvX *= - 1;
		result.mtvY *= - 1;
		result.mtvZ *= - 1;
	}

	return result;

}

coneIntersectsCone = function( ax, ay, az, ar, bx, by, bz, br ){
	return false;
}

//https://github.com/bytezeroseven/AA.js